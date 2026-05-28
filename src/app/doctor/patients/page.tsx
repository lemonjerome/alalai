import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import PatientProfile from '@/models/PatientProfile';
import { sanitizeUser } from '@/lib/utils';
import mongoose from 'mongoose';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { IUserDocument } from '@/models/User';
import type { IPatientProfileDocument } from '@/models/PatientProfile';

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default async function DoctorPatientsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'doctor') redirect('/dashboard');

  await connectDB();

  const doctorId = new mongoose.Types.ObjectId(session.user.id);
  const patientIds = (await Appointment.distinct('patientId', {
    doctorId,
    status: { $ne: 'cancelled' },
  })) as mongoose.Types.ObjectId[];

  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: patientIds } })
      .select('name email profilePictureUrl phone createdAt')
      .lean<IUserDocument[]>(),
    PatientProfile.find({ userId: { $in: patientIds } }).lean<IPatientProfileDocument[]>(),
  ]);

  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  const patients = users.map((u) => ({
    user: sanitizeUser(u),
    profile: profileMap.get(String(u._id)) ?? null,
  }));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
        <p className="text-sm text-gray-500 mt-1">
          {patients.length} unique patient{patients.length !== 1 ? 's' : ''} with non-cancelled appointments
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No patients yet</p>
          <p className="text-sm mt-1">Patients will appear here once they book appointments with you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(({ user, profile }) => {
            const u = user as unknown as {
              _id?: string;
              name?: string;
              email?: string;
              profilePictureUrl?: string;
              phone?: string;
            };
            return (
              <Card key={String(u._id)} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    {u.profilePictureUrl && <AvatarImage src={u.profilePictureUrl} alt={u.name} />}
                    <AvatarFallback className="bg-sky-100 text-sky-700 text-sm font-semibold">
                      {u.name ? initials(u.name) : 'PT'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{u.name ?? 'Unknown'}</p>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    {profile && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {profile.bloodType && `Blood: ${profile.bloodType}`}
                        {profile.bloodType && profile.allergies && profile.allergies.length > 0 && ' · '}
                        {profile.allergies && profile.allergies.length > 0 &&
                          `Allergies: ${profile.allergies.slice(0, 2).join(', ')}${profile.allergies.length > 2 ? '…' : ''}`}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/doctor/appointments?patient=${String(u._id)}`}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium shrink-0"
                  >
                    View appointments →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
