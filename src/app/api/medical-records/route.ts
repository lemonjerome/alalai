import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import type { IMedicalRecordDocument } from '@/models/MedicalRecord';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

// GET /api/medical-records — patient's own records, newest first, paginated
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '10', 10));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      MedicalRecord.find({ patientId: req.session.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IMedicalRecordDocument[]>(),
      MedicalRecord.countDocuments({ patientId: req.session.user.id }),
    ]);

    // Enrich with appointment and doctor info
    const apptIds = records.map((r) => r.appointmentId);
    const appointments = await Appointment.find({ _id: { $in: apptIds } })
      .lean<IAppointmentDocument[]>();
    const apptMap = new Map(appointments.map((a) => [String(a._id), a]));

    const doctorIds = [...new Set(records.map((r) => String(r.doctorId)))];
    const doctorUsers = await User.find({ _id: { $in: doctorIds } })
      .select('name profilePictureUrl')
      .lean<IUserDocument[]>();
    const doctorMap = new Map(doctorUsers.map((u) => [String(u._id), sanitizeUser(u)]));

    const enriched = records.map((record) => ({
      ...record,
      appointment: apptMap.get(String(record.appointmentId)),
      doctor: doctorMap.get(String(record.doctorId)),
    }));

    return NextResponse.json({ records: enriched, total, page, pages: Math.ceil(total / limit) });
  },
  { roles: ['patient'] }
);
