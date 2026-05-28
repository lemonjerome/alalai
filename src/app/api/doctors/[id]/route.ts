import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import DoctorProfile from '@/models/DoctorProfile';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';

// GET /api/doctors/[id] — single doctor public profile (id = DoctorProfile._id)
export async function GET(
  _req: Request,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
  }

  await connectDB();

  const profile = await DoctorProfile.findById(id).lean<IDoctorProfileDocument>();

  if (!profile) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  const user = await User.findById(profile.userId).select('-passwordHash').lean();

  if (!user) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json({ user: sanitizeUser(user), doctorProfile: profile });
}
