import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { cancelAppointmentSchema } from '@/lib/validations/appointment';
import { NotificationService } from '@/lib/notification-service';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

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

    // Send notifications (best-effort)
    try {
      const cancelledBy: 'patient' | 'doctor' =
        String(appointment.patientId) === userId ? 'patient' : 'doctor';
      const [patientUser, doctorUser] = await Promise.all([
        User.findById(appointment.patientId).select('name').lean<IUserDocument>(),
        User.findById(appointment.doctorId).select('name').lean<IUserDocument>(),
      ]);

      // Doctor declining a pending request = rejection notification
      const isDoctorRejecting =
        cancelledBy === 'doctor' && appointment.status === 'pending';

      if (isDoctorRejecting) {
        await NotificationService.sendAppointmentRejected({
          patientId: String(appointment.patientId),
          doctorId: String(appointment.doctorId),
          doctorName: doctorUser?.name ?? 'Doctor',
          patientName: patientUser?.name ?? 'Patient',
          appointmentId: String(appointment._id),
          scheduledAt: appointment.scheduledAt,
          reason: parsed.data.cancellationReason,
        });
      } else {
        await NotificationService.sendAppointmentCancelled({
          patientId: String(appointment.patientId),
          doctorId: String(appointment.doctorId),
          doctorName: doctorUser?.name ?? 'Doctor',
          patientName: patientUser?.name ?? 'Patient',
          appointmentId: String(appointment._id),
          scheduledAt: appointment.scheduledAt,
          cancelledBy,
          reason: parsed.data.cancellationReason,
        });
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ appointment: updated });
  }
);
