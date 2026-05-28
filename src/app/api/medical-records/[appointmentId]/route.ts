import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { createMedicalRecordSchema, updateMedicalRecordSchema } from '@/lib/validations/medicalRecord';
import { NotificationService } from '@/lib/notification-service';
import { sanitizeUser } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import type { IMedicalRecordDocument } from '@/models/MedicalRecord';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours

// GET /api/medical-records/[appointmentId]
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { appointmentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    await connectDB();

    const record = await MedicalRecord.findOne({ appointmentId }).lean<IMedicalRecordDocument>();

    if (!record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    // Only patient or doctor of this appointment can view
    const userId = req.session.user.id;
    const isOwner = String(record.patientId) === userId || String(record.doctorId) === userId;
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ record });
  }
);

// POST /api/medical-records/[appointmentId] — doctor creates the record
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { appointmentId } = await params;

    // Rate limit: 10 record creations per minute per doctor
    const limited = await rateLimit(req, 'mutation', `record:${req.session.user.id}`);
    if (limited) return limited;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = createMedicalRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const appointment = await Appointment.findById(appointmentId).lean<IAppointmentDocument>();
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Doctor must own the appointment
    if (String(appointment.doctorId) !== req.session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check no existing record
    const existing = await MedicalRecord.findOne({ appointmentId }).lean();
    if (existing) {
      return NextResponse.json(
        { error: 'A medical record already exists for this appointment. Use PATCH to update.' },
        { status: 409 }
      );
    }

    const record = await MedicalRecord.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      ...parsed.data,
    });

    // Notify patient (best-effort)
    try {
      const doctorUser = await User.findById(appointment.doctorId)
        .select('name')
        .lean<IUserDocument>();
      await NotificationService.sendRecordAvailable({
        patientId: String(appointment.patientId),
        doctorName: sanitizeUser(doctorUser!)?.name ?? 'Doctor',
        appointmentId: String(appointment._id),
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ record }, { status: 201 });
  },
  { roles: ['doctor'] }
);

// PATCH /api/medical-records/[appointmentId] — doctor updates within 72h
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { appointmentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = updateMedicalRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await MedicalRecord.findOne({ appointmentId }).lean<IMedicalRecordDocument>();
    if (!record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    if (String(record.doctorId) !== req.session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 72h edit window
    const ageMs = Date.now() - record.createdAt.getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: 'Medical records can only be edited within 72 hours of creation' },
        { status: 403 }
      );
    }

    const updated = await MedicalRecord.findOneAndUpdate(
      { appointmentId, doctorId: req.session.user.id },
      { $set: parsed.data },
      { new: true }
    ).lean<IMedicalRecordDocument>();

    return NextResponse.json({ record: updated });
  },
  { roles: ['doctor'] }
);
