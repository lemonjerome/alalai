import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Stethoscope, Bell, ArrowRight, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

export const metadata: Metadata = { title: 'Dashboard — AlalAI' };

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-700',
};

export default async function PatientDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();

  const now = new Date();

  const [upcomingAppointments, unreadCount] = await Promise.all([
    Appointment.find({
      patientId: session.user.id,
      scheduledAt: { $gte: now },
      status: { $in: ['pending', 'confirmed'] },
    })
      .sort({ scheduledAt: 1 })
      .limit(3)
      .lean<IAppointmentDocument[]>(),
    Notification.countDocuments({ userId: session.user.id, isRead: false }),
  ]);

  // Fetch doctor names
  const doctorIds = [...new Set(upcomingAppointments.map((a) => String(a.doctorId)))];
  const doctorUsers = await User.find({ _id: { $in: doctorIds } })
    .select('name profilePictureUrl')
    .lean<IUserDocument[]>();
  const doctorMap = new Map(doctorUsers.map((u) => [String(u._id), sanitizeUser(u)]));

  const userName = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {userName} 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your health overview for today.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              <p className="text-sm text-gray-500">Upcoming appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Need a doctor?</p>
              <Link
                href="/doctors"
                className="text-sm font-semibold underline-offset-2 hover:underline"
              >
                Browse specialists →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          <Link
            href="/appointments"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming appointments</p>
              <Link href="/doctors" className="text-sm text-primary hover:underline mt-1 block">
                Book your first consultation
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {upcomingAppointments.map((appt) => {
                const doctor = doctorMap.get(String(appt.doctorId));
                const scheduledDate = new Date(appt.scheduledAt);
                return (
                  <li key={String(appt._id)}>
                    <Link
                      href={`/consultation/${String(appt._id)}`}
                      className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {doctor?.name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {scheduledDate.toLocaleDateString('en-PH', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {scheduledDate.toLocaleTimeString('en-PH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
