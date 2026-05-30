import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

// GET /api/doctors/me/appointments — doctor's appointment list with filters
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

    const query: Record<string, unknown> = { doctorId: req.session.user.id };

    if (status) {
      query.status = status;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) dateFilter.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) dateFilter.$lte = toDate;
      }
      if (Object.keys(dateFilter).length > 0) {
        query.scheduledAt = dateFilter;
      }
    }

    const skip = (page - 1) * limit;

    const [rawAppointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IAppointmentDocument[]>(),
      Appointment.countDocuments(query),
    ]);

    // Join patient names in one batch query
    const patientUserIds = [...new Set(rawAppointments.map((a) => String(a.patientId)))];
    const patientUsers = await User.find({ _id: { $in: patientUserIds } })
      .select('name')
      .lean<IUserDocument[]>();
    const patientNameMap = new Map(patientUsers.map((u) => [String(u._id), u.name]));

    const appointments = rawAppointments.map((a) => ({
      ...a,
      patientName: patientNameMap.get(String(a.patientId)) ?? null,
    }));

    return NextResponse.json({
      appointments,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  },
  { roles: ['doctor'] }
);
