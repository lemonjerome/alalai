import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import { cancelAppointmentSchema } from '@/lib/validations/appointment';
import type { IAppointmentDocument } from '@/models/Appointment';

// PATCH /api/appointments/[id]/cancel — patient or doctor
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = cancelAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const appointment = await Appointment.findById(id).lean<IAppointmentDocument>();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Ownership: patient or doctor
    const userId = req.session.user.id;
    const isOwner =
      String(appointment.patientId) === userId || String(appointment.doctorId) === userId;

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 409 });
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed appointment' },
        { status: 409 }
      );
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled', cancellationReason: parsed.data.cancellationReason },
      { new: true }
    ).lean<IAppointmentDocument>();

    return NextResponse.json({ appointment: updated });
  }
);
