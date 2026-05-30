import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/api-guard';
import {
  recommendRequestSchema,
  ollamaResponseSchema,
  type RecommendedDoctor,
  type SpecializationGroup,
} from '@/lib/validations/recommend';
import DoctorProfile from '@/models/DoctorProfile';
import User from '@/models/User';
import Appointment from '@/models/Appointment';
import mongoose from 'mongoose';

const OLLAMA_BASE_URL = 'https://ollama.com';
const OLLAMA_MODEL = 'gemma4:31b-cloud';

function buildSystemPrompt(specializations: string[]): string {
  const list = specializations.map((s) => `- ${s}`).join('\n');
  return `You are a medical triage assistant for AlalAI telehealth. Your job is to map patient symptoms to the most relevant medical specializations from the list below.

Available specializations:
${list}

STRICT OUTPUT RULES — no exceptions:
1. Respond with ONLY the JSON object below. No markdown. No code fences. No extra text. No disclaimers.
2. "specializations" must be an array containing one or more strings from the available list above (exact strings only — copy them verbatim).
3. Choose multiple specializations if the symptoms could benefit from more than one type of specialist.
4. "reasoning" must be 1-2 empathetic sentences explaining your recommendation.
5. If unsure, default to ["General Practice"].

Required output format (copy this structure exactly):
{"specializations":["General Practice"],"reasoning":"A general practitioner can evaluate your symptoms and refer you to the right specialist."}

Now respond to the patient symptoms in that exact JSON format:`;
}

async function buildDoctorResult(
  profile: Record<string, unknown>,
  userMap: Map<string, { _id: unknown; name: string; profilePictureUrl?: string }>,
): Promise<RecommendedDoctor | null> {
  const u = userMap.get(String(profile.userId));
  if (!u) return null;
  return {
    _id: String(u._id),
    name: u.name,
    profilePictureUrl: u.profilePictureUrl ?? '',
    doctorProfileId: String(profile._id),
    specialization: profile.specialization as string[],
    bio: (profile.bio as string) ?? '',
    yearsOfExperience: (profile.yearsOfExperience as number) ?? 0,
    consultationFee: (profile.consultationFee as number) ?? 0,
    rating: (profile.rating as number) ?? 0,
    reviewCount: (profile.reviewCount as number) ?? 0,
    isVerified: (profile.isVerified as boolean) ?? false,
  } satisfies RecommendedDoctor;
}

export const POST = withAuth(
  async (req) => {
    const body = recommendRequestSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { symptoms } = body.data;

    await connectDB();

    // ── Get all distinct specializations from the database ─────────────────
    const dbSpecializations = (await DoctorProfile.distinct('specialization', {
      isAcceptingPatients: true,
    })) as string[];

    if (dbSpecializations.length === 0) {
      return NextResponse.json(
        { error: 'No doctors are currently available.' },
        { status: 503 },
      );
    }

    // Sort for consistent prompt ordering
    const sortedSpecs = [...dbSpecializations].sort();

    // ── Call Ollama Cloud API ──────────────────────────────────────────────
    const ollamaKey = process.env.OLLAMA_KEY;
    if (!ollamaKey) {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 503 },
      );
    }

    let chosenSpecializations: string[];
    let reasoning: string;

    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ollamaKey}`,
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt(sortedSpecs) },
            { role: 'user', content: symptoms },
          ],
          temperature: 0.2,
          stream: false,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!ollamaRes.ok) {
        const errText = await ollamaRes.text();
        throw new Error(`Ollama API error ${ollamaRes.status}: ${errText}`);
      }

      const ollamaData = (await ollamaRes.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawContent = ollamaData.choices?.[0]?.message?.content ?? '';

      // Strip any accidental markdown code fences
      const cleaned = rawContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleaned) as unknown;
      const validated = ollamaResponseSchema.safeParse(parsed);

      if (!validated.success) {
        // Fallback: use any specializations found in the raw text
        const fallback = sortedSpecs.filter((s) => rawContent.includes(s));
        chosenSpecializations = fallback.length > 0 ? fallback : ['General Practice'];
        reasoning =
          'Based on your symptoms, the recommended specialists can help evaluate and treat your condition.';
      } else {
        // Filter to only specializations that actually exist in the DB
        const valid = validated.data.specializations.filter((s) =>
          dbSpecializations.includes(s),
        );
        chosenSpecializations = valid.length > 0 ? valid : ['General Practice'];
        reasoning = validated.data.reasoning;
      }
    } catch {
      // If the AI call fails entirely, fall back gracefully
      chosenSpecializations = ['General Practice'];
      reasoning =
        'Our AI is temporarily unavailable. A General Practitioner can evaluate your symptoms and refer you to a specialist if needed.';
    }

    // ── Query matching doctors for each specialization ────────────────────
    const bySpecialization: Record<string, SpecializationGroup> = {};

    for (const spec of chosenSpecializations) {
      const profiles = await DoctorProfile.find({
        specialization: spec,
        isAcceptingPatients: true,
      })
        .lean<Record<string, unknown>[]>();

      if (profiles.length === 0) {
        bySpecialization[spec] = { topRated: [], mostAvailable: [] };
        continue;
      }

      const userIds = profiles.map((p) => p.userId as mongoose.Types.ObjectId);

      const users = await User.find({ _id: { $in: userIds } })
        .select('name profilePictureUrl')
        .lean<{ _id: unknown; name: string; profilePictureUrl?: string }[]>();

      const userMap = new Map(users.map((u) => [String(u._id), u]));

      // Top rated: sort by rating descending, take top 5
      const topRatedProfiles = [...profiles]
        .sort((a, b) => ((b.rating as number) ?? 0) - ((a.rating as number) ?? 0))
        .slice(0, 5);

      // Most available: sort by fewest upcoming confirmed/pending appointments
      const now = new Date();
      const upcomingCounts = await Appointment.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            doctorId: { $in: userIds },
            status: { $in: ['pending', 'confirmed'] },
            scheduledAt: { $gte: now },
          },
        },
        {
          $group: {
            _id: { $toString: '$doctorId' },
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map(upcomingCounts.map((c) => [c._id, c.count]));

      const mostAvailableProfiles = [...profiles]
        .sort(
          (a, b) =>
            (countMap.get(String(a.userId)) ?? 0) -
            (countMap.get(String(b.userId)) ?? 0),
        )
        .slice(0, 5);

      // Build doctor objects
      const topRated: RecommendedDoctor[] = (
        await Promise.all(topRatedProfiles.map((p) => buildDoctorResult(p, userMap)))
      ).filter((d): d is RecommendedDoctor => d !== null);

      const mostAvailable: RecommendedDoctor[] = (
        await Promise.all(mostAvailableProfiles.map((p) => buildDoctorResult(p, userMap)))
      ).filter((d): d is RecommendedDoctor => d !== null);

      bySpecialization[spec] = { topRated, mostAvailable };
    }

    return NextResponse.json({
      specializations: chosenSpecializations,
      reasoning,
      bySpecialization,
    });
  },
  { roles: ['patient'] },
);
