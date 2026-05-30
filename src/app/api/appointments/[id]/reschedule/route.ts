import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import User from '@/models/User';
import { rescheduleAppointmentSchema } from '@/lib/validations/appointment';
import { getAvailableSlots, PH_TZ_OFFSET_MINUTES } from '@/lib/availability-utils';
import { NotificationService } from '@/lib/notification-service';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IAvailabilityDocument } from '@/models/Availability';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';
import type { IUserDocument } from '@/models/User';

// PATCH /api/appointments/[id]/reschedule — patient only
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

    const parsed = rescheduleAppointmentSchema.safeParse(body);
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

    if (String(appointment.patientId) !== req.session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Cannot reschedule a cancelled or completed appointment' },
        { status: 409 }
      );
    }

    const newDate = new Date(parsed.data.scheduledAt);

    // Validate new slot is available
    const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId })
      .select('_id userId')
      .lean<IDoctorProfileDocument>();

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const avails = await Availability.find({
      doctorId: doctorProfile._id,
      isActive: true,
    }).lean<IAvailabilityDocument[]>();

    const existingAppts = await Appointment.find({
      doctorId: appointment.doctorId,
      scheduledAt: {
        $gte: new Date(newDate.toISOString().slice(0, 10)),
        $lt: new Date(
          new Date(newDate.toISOString().slice(0, 10)).getTime() + 24 * 60 * 60 * 1000
        ),
      },
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: appointment._id }, // exclude current appointment
    }).lean<IAppointmentDocument[]>();

    const availableSlots = getAvailableSlots(newDate, avails, existingAppts, PH_TZ_OFFSET_MINUTES);
    const slotExists = availableSlots.some((s) => s.startISO === newDate.toISOString());

    if (!slotExists) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      );
    }

    // Fetch patient and doctor names for the notification
    const [patientUser, doctorUser] = await Promise.all([
      User.findById(appointment.patientId).select('name').lean<IUserDocument>(),
      User.findById(appointment.doctorId).select('name').lean<IUserDocument>(),
    ]);

    // Create new appointment referencing the old one — status is 'pending' so doctor must re-confirm
    const newApptId = new mongoose.Types.ObjectId();
    const [newAppointment] = await Promise.all([
      Appointment.create({
        _id: newApptId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        doctorProfileId: appointment.doctorProfileId,
        scheduledAt: newDate,
        durationMinutes: appointment.durationMinutes,
        status: 'pending',
        rescheduledFrom: appointment._id,
        jitsiRoomId: `alalai-${newApptId.toString()}`,
      }),
      // Cancel old appointment
      Appointment.findByIdAndUpdate(id, {
        status: 'cancelled',
        cancellationReason: 'Rescheduled by patient',
      }),
    ]);

    // Notify both parties — doctor's notification asks them to re-confirm
    NotificationService.sendAppointmentRescheduled({
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      doctorName: doctorUser?.name ?? 'Doctor',
      patientName: patientUser?.name ?? 'Patient',
      newAppointmentId: newApptId.toString(),
      newScheduledAt: newDate,
    }).catch(() => {/* non-blocking */});

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  },
  { roles: ['patient'] }
);
