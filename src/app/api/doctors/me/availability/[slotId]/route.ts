import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import { updateAvailabilitySlotSchema } from '@/lib/validations/doctor';

// PATCH /api/doctors/me/availability/[slotId]
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { slotId } = await params;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateAvailabilitySlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await DoctorProfile.findOne({ userId: req.session.user.id })
      .select('_id')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Ownership check: slot must belong to this doctor
    const slot = await Availability.findOneAndUpdate(
      { _id: slotId, doctorId: profile._id },
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({ slot });
  },
  { roles: ['doctor'] }
);

// DELETE /api/doctors/me/availability/[slotId]
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { slotId } = await params;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    await connectDB();

    const profile = await DoctorProfile.findOne({ userId: req.session.user.id })
      .select('_id')
      .lean();

    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const slot = await Availability.findOneAndDelete({
      _id: slotId,
      doctorId: profile._id,
    }).lean();

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Slot deleted' });
  },
  { roles: ['doctor'] }
);
