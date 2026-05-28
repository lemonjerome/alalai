import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import DoctorProfile from '@/models/DoctorProfile';
import Availability from '@/models/Availability';
import Appointment from '@/models/Appointment';
import { getAvailableSlots } from '@/lib/availability-utils';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';
import type { IAvailabilityDocument } from '@/models/Availability';
import type { IAppointmentDocument } from '@/models/Appointment';

// GET /api/doctors/[id]/availability?from=ISO&to=ISO
// Returns available time slots for each date in the range.
export async function GET(
  req: Request,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: 'Query params "from" and "to" are required (ISO date strings)' },
      { status: 400 }
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid date format for "from" or "to"' }, { status: 400 });
  }

  // Clamp range to 31 days to prevent abuse
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const dayRange = Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
  if (dayRange < 0 || dayRange > 31) {
    return NextResponse.json(
      { error: 'Date range must be between 0 and 31 days' },
      { status: 400 }
    );
  }

  await connectDB();

  const profile = await DoctorProfile.findById(id)
    .select('_id')
    .lean<IDoctorProfileDocument>();

  if (!profile) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  const [avails, appointments] = await Promise.all([
    Availability.find({ doctorId: profile._id, isActive: true }).lean<IAvailabilityDocument[]>(),
    Appointment.find({
      doctorId: profile.userId,
      scheduledAt: { $gte: from, $lte: to },
      status: { $in: ['pending', 'confirmed'] },
    }).lean<IAppointmentDocument[]>(),
  ]);

  // Build a result keyed by date string
  const result: Record<string, { startISO: string; endISO: string }[]> = {};

  // Iterate each day in [from, to]
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10); // YYYY-MM-DD
    const slots = getAvailableSlots(new Date(cursor), avails, appointments);
    result[dateKey] = slots.map((s) => ({ startISO: s.startISO, endISO: s.endISO }));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return NextResponse.json({ availability: result });
}
