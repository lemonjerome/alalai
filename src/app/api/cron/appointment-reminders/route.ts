import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { NotificationService } from '@/lib/notification-service';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

// GET /api/cron/appointment-reminders
// Called by Vercel Cron (every 5 minutes). Requires Bearer CRON_SECRET header.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  // 30-minute window: appointments starting in [now+25min, now+35min]
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);

  const upcomingAppointments = await Appointment.find({
    scheduledAt: { $gte: windowStart, $lt: windowEnd },
    status: 'confirmed',
    reminderSentAt: null,
  }).lean<IAppointmentDocument[]>();

  let sent = 0;

  for (const appt of upcomingAppointments) {
    try {
      const [patientUser, doctorUser] = await Promise.all([
        User.findById(appt.patientId).select('name').lean<IUserDocument>(),
        User.findById(appt.doctorId).select('name').lean<IUserDocument>(),
      ]);

      await Promise.all([
        NotificationService.sendAppointmentReminder({
          userId: String(appt.patientId),
          otherName: doctorUser?.name ?? 'Doctor',
          appointmentId: String(appt._id),
          scheduledAt: appt.scheduledAt,
          role: 'patient',
        }),
        NotificationService.sendAppointmentReminder({
          userId: String(appt.doctorId),
          otherName: patientUser?.name ?? 'Patient',
          appointmentId: String(appt._id),
          scheduledAt: appt.scheduledAt,
          role: 'doctor',
        }),
      ]);

      await Appointment.findByIdAndUpdate(appt._id, { reminderSentAt: now });
      sent++;
    } catch {
      // Continue to next appointment
    }
  }

  return NextResponse.json({
    message: `30-min reminders sent for ${sent} of ${upcomingAppointments.length} appointments`,
    processed: upcomingAppointments.length,
    sent,
  });
}
