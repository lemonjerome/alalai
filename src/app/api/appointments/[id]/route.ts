import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import type { IAppointmentDocument } from '@/models/Appointment';

// GET /api/appointments/[id] — patient or doctor of that appointment
export const GET = withAuth(
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

    // Ownership: must be patient or doctor of this appointment
    const userId = req.session.user.id;
    const isOwner =
      String(appointment.patientId) === userId || String(appointment.doctorId) === userId;

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ appointment });
  }
);
