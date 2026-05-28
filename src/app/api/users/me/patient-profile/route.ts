import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import PatientProfile from '@/models/PatientProfile';
import { updatePatientProfileSchema } from '@/lib/validations/user';

// GET /api/users/me/patient-profile
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const profile = await PatientProfile.findOne({ userId: req.session.user.id }).lean();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  },
  { roles: ['patient'] }
);

// PATCH /api/users/me/patient-profile
export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updatePatientProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const profile = await PatientProfile.findOneAndUpdate(
      { userId: req.session.user.id },
      { $set: parsed.data },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ profile });
  },
  { roles: ['patient'] }
);
