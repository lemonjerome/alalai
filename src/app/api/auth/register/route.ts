import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import PatientProfile from '@/models/PatientProfile';
import DoctorProfile from '@/models/DoctorProfile';
import { registerSchema } from '@/lib/validations/auth';
import { sanitizeUser } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, 'auth');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  await connectDB();

  const existing = await User.findOne({ email: data.email }).lean();
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    email: data.email,
    name: data.name,
    phone: data.phone ?? '',
    role: data.role,
    passwordHash,
  });

  if (data.role === 'patient') {
    await PatientProfile.create({ userId: user._id });
  } else {
    await DoctorProfile.create({
      userId: user._id,
      licenseNumber: data.licenseNumber,
      specialization: data.specialization,
      yearsOfExperience: data.yearsOfExperience ?? 0,
    });
  }

  return NextResponse.json(
    { message: 'Registration successful', user: sanitizeUser(user.toObject()) },
    { status: 201 }
  );
}
