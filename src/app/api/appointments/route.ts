import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import User from '@/models/User';
import { createAppointmentSchema } from '@/lib/validations/appointment';
import { getAvailableSlots } from '@/lib/availability-utils';
import { NotificationService } from '@/lib/notification-service';
import { rateLimit } from '@/lib/rate-limit';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';
import type { IAvailabilityDocument } from '@/models/Availability';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

// GET /api/appointments — patient fetches own appointments (enriched with counterpart name)
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

    const query: Record<string, unknown> = { patientId: req.session.user.id };

    if (status === 'upcoming') {
      // Active (pending or confirmed) and not in the past
      query.status = { $in: ['pending', 'confirmed'] };
      query.scheduledAt = { $gte: new Date() };
    } else if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    // Upcoming: soonest first; everything else: newest first
    const sortOrder = status === 'upcoming' ? 1 : -1;
    const [rawAppointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ scheduledAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean<IAppointmentDocument[]>(),
      Appointment.countDocuments(query),
    ]);

    // Join doctor names in one batch query
    const doctorUserIds = [...new Set(rawAppointments.map((a) => String(a.doctorId)))];
    const doctorUsers = await User.find({ _id: { $in: doctorUserIds } })
      .select('name')
      .lean<IUserDocument[]>();
    const doctorNameMap = new Map(doctorUsers.map((u) => [String(u._id), u.name]));

    const appointments = rawAppointments.map((a) => ({
      ...a,
      doctorName: doctorNameMap.get(String(a.doctorId)) ?? null,
    }));

    return NextResponse.json({ appointments, total, page, pages: Math.ceil(total / limit) });
  },
  { roles: ['patient'] }
);

// POST /api/appointments — patient books an appointment
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    // Rate limit: 10 bookings per minute per user
    const limited = await rateLimit(req, 'mutation', `book:${req.session.user.id}`);
    if (limited) return limited;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { doctorId, scheduledAt, durationMinutes } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    await connectDB();

    // Find doctor's DoctorProfile (doctorId here = DoctorProfile._id)
    const doctorProfile = await DoctorProfile.findById(doctorId)
      .select('_id userId')
      .lean<IDoctorProfileDocument>();

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const requestedDate = new Date(scheduledAt);

    // Validate slot is available
    const avails = await Availability.find({
      doctorId: doctorProfile._id,
      isActive: true,
    }).lean<IAvailabilityDocument[]>();

    const existingAppts = await Appointment.find({
      doctorId: doctorProfile.userId,
      scheduledAt: {
        $gte: new Date(requestedDate.toISOString().slice(0, 10)),
        $lt: new Date(
          new Date(requestedDate.toISOString().slice(0, 10)).getTime() + 24 * 60 * 60 * 1000
        ),
      },
      status: { $in: ['pending', 'confirmed'] },
    }).lean<IAppointmentDocument[]>();

    const availableSlots = getAvailableSlots(requestedDate, avails, existingAppts);
    const requestedISO = requestedDate.toISOString();
    const slotExists = availableSlots.some((s) => s.startISO === requestedISO);

    if (!slotExists) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      );
    }

    const appointmentId = new mongoose.Types.ObjectId();
    const appointment = await Appointment.create({
      _id: appointmentId,
      patientId: req.session.user.id,
      doctorId: doctorProfile.userId,
      doctorProfileId: doctorProfile._id,
      scheduledAt: requestedDate,
      durationMinutes,
      status: 'pending',
      jitsiRoomId: `alalai-${appointmentId.toString()}`,
    });

    // Send booking request notifications (best-effort)
    try {
      const [patientUser, doctorUser] = await Promise.all([
        User.findById(req.session.user.id).select('name').lean<IUserDocument>(),
        User.findById(doctorProfile.userId).select('name').lean<IUserDocument>(),
      ]);
      await NotificationService.sendBookingRequest({
        patientId: req.session.user.id,
        doctorId: String(doctorProfile.userId),
        doctorName: doctorUser?.name ?? 'Doctor',
        patientName: patientUser?.name ?? 'Patient',
        appointmentId: String(appointmentId),
        scheduledAt: requestedDate,
      });
    } catch {
      // Non-fatal — appointment is already created
    }

    return NextResponse.json({ appointment }, { status: 201 });
  },
  { roles: ['patient'] }
);
