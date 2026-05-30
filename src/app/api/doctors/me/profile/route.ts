import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import DoctorProfile from '@/models/DoctorProfile';
import User from '@/models/User';
import { updateDoctorProfileSchema } from '@/lib/validations/doctor';
import { sanitizeUser } from '@/lib/utils';

// GET /api/doctors/me/profile
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const [profile, user] = await Promise.all([
      DoctorProfile.findOne({ userId: req.session.user.id }).lean(),
      User.findById(req.session.user.id).lean(),
    ]);

    if (!profile || !user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ doctorProfile: profile, user: sanitizeUser(user) });
  },
  { roles: ['doctor'] }
);

// PATCH /api/doctors/me/profile
export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateDoctorProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Split fields: some go to User model, rest to DoctorProfile
    const { name, phone, ...profileFields } = parsed.data;

    const [profile, user] = await Promise.all([
      DoctorProfile.findOneAndUpdate(
        { userId: req.session.user.id },
        { $set: profileFields },
        { new: true }
      ).lean(),
      name || phone
        ? User.findByIdAndUpdate(
            req.session.user.id,
            { $set: { ...(name && { name }), ...(phone && { phone }) } },
            { new: true }
          ).lean()
        : User.findById(req.session.user.id).lean(),
    ]);

    if (!profile || !user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ doctorProfile: profile, user: sanitizeUser(user) });
  },
  { roles: ['doctor'] }
);
