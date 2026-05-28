import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import { rescheduleAppointmentSchema } from '@/lib/validations/appointment';
import { getAvailableSlots } from '@/lib/availability-utils';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IAvailabilityDocument } from '@/models/Availability';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';

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

    const availableSlots = getAvailableSlots(newDate, avails, existingAppts);
    const slotExists = availableSlots.some((s) => s.startISO === newDate.toISOString());

    if (!slotExists) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      );
    }

    // Create new appointment referencing the old one
    const newApptId = new mongoose.Types.ObjectId();
    const [newAppointment] = await Promise.all([
      Appointment.create({
        _id: newApptId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        doctorProfileId: appointment.doctorProfileId,
        scheduledAt: newDate,
        durationMinutes: appointment.durationMinutes,
        status: 'confirmed',
        rescheduledFrom: appointment._id,
        jitsiRoomId: `alalai-${newApptId.toString()}`,
      }),
      // Cancel old appointment
      Appointment.findByIdAndUpdate(id, {
        status: 'cancelled',
        cancellationReason: 'Rescheduled by patient',
      }),
    ]);

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  },
  { roles: ['patient'] }
);
