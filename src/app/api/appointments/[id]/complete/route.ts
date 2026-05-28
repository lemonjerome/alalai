import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import type { IAppointmentDocument } from '@/models/Appointment';

// PATCH /api/appointments/[id]/complete — doctor only
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    await connectDB();

    const appointment = await Appointment.findById(id).lean<IAppointmentDocument>();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Ownership: must be the doctor
    if (String(appointment.doctorId) !== req.session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (appointment.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Only confirmed appointments can be marked as completed' },
        { status: 409 }
      );
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    ).lean<IAppointmentDocument>();

    return NextResponse.json({ appointment: updated });
  },
  { roles: ['doctor'] }
);
