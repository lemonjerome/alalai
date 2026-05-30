import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import DoctorProfile from '@/models/DoctorProfile';
import { sanitizeUser } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';

export const metadata: Metadata = { title: 'Doctor Dashboard — AlalAI' };

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-700',
};

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const profile = await DoctorProfile.findOne({ userId: session.user.id })
    .select('_id')
    .lean<IDoctorProfileDocument>();

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-gray-500">
          Your doctor profile is not yet set up.{' '}
          <Link href="/doctor/profile" className="text-primary underline">
            Complete your profile
          </Link>{' '}
          to start accepting patients.
        </p>
      </div>
    );
  }

  const [todayAppointments, pendingCount, totalPatients] = await Promise.all([
    Appointment.find({
      doctorId: session.user.id,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['pending', 'confirmed'] },
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean<IAppointmentDocument[]>(),
    Appointment.countDocuments({
      doctorId: session.user.id,
      status: 'pending',
    }),
    Appointment.distinct('patientId', {
      doctorId: session.user.id,
      status: { $in: ['confirmed', 'completed'] },
    }).then((ids) => ids.length),
  ]);

  // Fetch patient names
  const patientIds = [...new Set(todayAppointments.map((a) => String(a.patientId)))];
  const patientUsers = await User.find({ _id: { $in: patientIds } })
    .select('name')
    .lean<IUserDocument[]>();
  const patientMap = new Map(patientUsers.map((u) => [String(u._id), sanitizeUser(u)]));

  const doctorName = session.user.name?.split(' ')[0] ?? 'Doctor';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good day, Dr. {doctorName} 👨‍⚕️</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your schedule and patient overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayAppointments.length}</p>
              <p className="text-sm text-gray-500">Today&apos;s appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending requests</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPatients}</p>
              <p className="text-sm text-gray-500">Total patients</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          <Link
            href="/doctor/appointments"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            All appointments <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No appointments scheduled for today</p>
            </div>
          ) : (
            <ul className="divide-y">
              {todayAppointments.map((appt) => {
                const patient = patientMap.get(String(appt.patientId));
                const scheduledDate = new Date(appt.scheduledAt);
                return (
                  <li key={String(appt._id)}>
                    <Link
                      href={`/consultation/${String(appt._id)}`}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {patient?.name ?? 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {scheduledDate.toLocaleTimeString('en-PH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {appt.durationMinutes} min
                        </p>
                      </div>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[appt.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {appt.status}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
