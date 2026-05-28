import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import PatientProfile from '@/models/PatientProfile';
import { sanitizeUser } from '@/lib/utils';
import type { IUserDocument } from '@/models/User';
import type { IPatientProfileDocument } from '@/models/PatientProfile';

// GET /api/doctors/me/patients — unique patients who have had appointments with this doctor
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
    const skip = (page - 1) * limit;

    const doctorId = new mongoose.Types.ObjectId(req.session.user.id);

    // Aggregate unique patient IDs from all non-cancelled appointments
    const patientIds = await Appointment.distinct('patientId', {
      doctorId,
      status: { $ne: 'cancelled' },
    }) as mongoose.Types.ObjectId[];

    const total = patientIds.length;

    // Paginate
    const pagePatientIds = patientIds.slice(skip, skip + limit);

    const [users, profiles] = await Promise.all([
      User.find({ _id: { $in: pagePatientIds } })
        .select('name email profilePictureUrl phone createdAt')
        .lean<IUserDocument[]>(),
      PatientProfile.find({ userId: { $in: pagePatientIds } })
        .lean<IPatientProfileDocument[]>(),
    ]);

    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

    const patients = users.map((u) => ({
      user: sanitizeUser(u),
      profile: profileMap.get(String(u._id)) ?? null,
    }));

    return NextResponse.json({ patients, total, page, pages: Math.ceil(total / limit) });
  },
  { roles: ['doctor'] }
);
