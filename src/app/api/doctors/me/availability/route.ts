import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import { availabilitySlotSchema } from '@/lib/validations/doctor';

// GET /api/doctors/me/availability — list all weekly slots for the doctor
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const profile = await DoctorProfile.findOne({ userId: req.session.user.id })
      .select('_id')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const slots = await Availability.find({
      doctorId: profile._id,
    })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ slots });
  },
  { roles: ['doctor'] }
);

// POST /api/doctors/me/availability — add a new weekly slot
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = availabilitySlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const profile = await DoctorProfile.findOne({ userId: req.session.user.id })
      .select('_id')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Validate no time conflict on same day
    const { dayOfWeek, startTime, endTime } = parsed.data;
    const existing = await Availability.findOne({
      doctorId: profile._id,
      dayOfWeek,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: 'This slot overlaps with an existing availability slot' },
        { status: 409 }
      );
    }

    const slot = await Availability.create({
      doctorId: profile._id,
      ...parsed.data,
    });

    return NextResponse.json({ slot }, { status: 201 });
  },
  { roles: ['doctor'] }
);
