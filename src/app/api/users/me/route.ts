import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import User from '@/models/User';
import PatientProfile from '@/models/PatientProfile';
import DoctorProfile from '@/models/DoctorProfile';
import { sanitizeUser } from '@/lib/utils';
import { updateUserSchema } from '@/lib/validations/user';

// GET /api/users/me — return current user merged with their role profile
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  await connectDB();

  const user = await User.findById(req.session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let profile = null;
  if (user.role === 'patient') {
    profile = await PatientProfile.findOne({ userId: user._id }).lean();
  } else {
    profile = await DoctorProfile.findOne({ userId: user._id }).lean();
  }

  return NextResponse.json({
    user: sanitizeUser(user),
    profile,
  });
});

// PATCH /api/users/me — update name, phone, profilePictureUrl only
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  await connectDB();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await User.findByIdAndUpdate(
    req.session.user.id,
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: sanitizeUser(user) });
});
