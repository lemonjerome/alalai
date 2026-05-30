import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { NotificationService } from '@/lib/notification-service';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

// PATCH /api/appointments/[id]/confirm — doctor confirms a pending appointment
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

    // Only the doctor of this appointment can confirm it
    if (String(appointment.doctorId) !== req.session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (appointment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending appointments can be confirmed' },
        { status: 409 }
      );
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { status: 'confirmed' },
      { new: true }
    ).lean<IAppointmentDocument>();

    try {
      const [patientUser, doctorUser] = await Promise.all([
        User.findById(appointment.patientId).select('name').lean<IUserDocument>(),
        User.findById(appointment.doctorId).select('name').lean<IUserDocument>(),
      ]);
      await NotificationService.sendAppointmentConfirmed({
        patientId: String(appointment.patientId),
        doctorId: String(appointment.doctorId),
        doctorName: doctorUser?.name ?? 'Doctor',
        patientName: patientUser?.name ?? 'Patient',
        appointmentId: String(appointment._id),
        scheduledAt: appointment.scheduledAt,
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ appointment: updated });
  },
  { roles: ['doctor'] }
);
