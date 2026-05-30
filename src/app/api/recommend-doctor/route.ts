import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth } from '@/lib/api-guard';
import {
  recommendRequestSchema,
  ollamaResponseSchema,
  SUPPORTED_SPECIALIZATIONS,
  type RecommendedDoctor,
} from '@/lib/validations/recommend';
import DoctorProfile from '@/models/DoctorProfile';
import User from '@/models/User';
import mongoose from 'mongoose';

const OLLAMA_BASE_URL = 'https://api.ollama.com';
const OLLAMA_MODEL = 'gemma4';

const SYSTEM_PROMPT = `You are a professional medical triage assistant for AlalAI, a telehealth platform.

Your task is to read a patient's symptom description and route them to exactly ONE of these specializations:
- General Practitioner
- Pediatrics
- Dermatology
- Mental Health
- Cardiology

Rules:
1. Always respond with ONLY valid JSON — no markdown, no code blocks, no extra text.
2. The "specialization" field must be one of the exact strings listed above.
3. The "reasoning" field must be a short, empathetic 1-2 sentence explanation that helps the patient understand why this specialist is recommended.
4. When in doubt, prefer "General Practitioner".

Response format (strict JSON):
{"specialization":"<one of the five>","reasoning":"<supportive explanation>"}`;

export const POST = withAuth(
  async (req) => {
    const body = recommendRequestSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { symptoms } = body.data;

    // ── Call Ollama Cloud API ──────────────────────────────────────────────
    const ollamaKey = process.env.OLLAMA_KEY;
    if (!ollamaKey) {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 503 }
      );
    }

    let specialization: (typeof SUPPORTED_SPECIALIZATIONS)[number];
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
            { role: 'system', content: SYSTEM_PROMPT },
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
        // Fallback: try to extract a known specialization from the raw text
        const fallback = SUPPORTED_SPECIALIZATIONS.find((s) =>
          rawContent.includes(s)
        );
        specialization = fallback ?? 'General Practitioner';
        reasoning =
          'Based on your symptoms, a General Practitioner can evaluate you and refer you to the right specialist if needed.';
      } else {
        specialization = validated.data.specialization;
        reasoning = validated.data.reasoning;
      }
    } catch {
      // If the AI call fails entirely, fall back gracefully
      specialization = 'General Practitioner';
      reasoning =
        'Our AI is temporarily unavailable. A General Practitioner can evaluate your symptoms and refer you to a specialist if needed.';
    }

    // ── Query matching doctors ─────────────────────────────────────────────
    await connectDB();

    const profiles = await DoctorProfile.find({
      specialization: specialization,
      isAcceptingPatients: true,
    })
      .limit(6)
      .lean();

    const userIds = profiles.map((p) => p.userId as mongoose.Types.ObjectId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name profilePictureUrl')
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const doctors: RecommendedDoctor[] = profiles
      .map((p) => {
        const u = userMap.get(String(p.userId));
        if (!u) return null;
        return {
          _id: String(u._id),
          name: u.name,
          profilePictureUrl: u.profilePictureUrl ?? '',
          doctorProfileId: String(p._id),
          specialization: p.specialization,
          bio: p.bio,
          yearsOfExperience: p.yearsOfExperience,
          consultationFee: p.consultationFee,
          rating: p.rating,
          reviewCount: p.reviewCount,
          isVerified: p.isVerified,
        } satisfies RecommendedDoctor;
      })
      .filter((d): d is RecommendedDoctor => d !== null);

    return NextResponse.json({ specialization, reasoning, doctors });
  },
  { roles: ['patient'] }
);
