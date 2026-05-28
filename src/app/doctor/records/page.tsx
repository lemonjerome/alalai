import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Plus } from 'lucide-react';
import type { IMedicalRecordDocument } from '@/models/MedicalRecord';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default async function DoctorRecordsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'doctor') redirect('/dashboard');

  await connectDB();

  const records = await MedicalRecord.find({ doctorId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<IMedicalRecordDocument[]>();

  const apptIds = records.map((r) => r.appointmentId);
  const patientIds = [...new Set(records.map((r) => String(r.patientId)))];

  const [appointments, patients] = await Promise.all([
    Appointment.find({ _id: { $in: apptIds } }).lean<IAppointmentDocument[]>(),
    User.find({ _id: { $in: patientIds } })
      .select('name email profilePictureUrl')
      .lean<IUserDocument[]>(),
  ]);

  const apptMap = new Map(appointments.map((a) => [String(a._id), a]));
  const patientMap = new Map(patients.map((u) => [String(u._id), sanitizeUser(u)]));

  // eslint-disable-next-line react-hooks/purity -- RSC, not a hook
  const now = Date.now();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Records</h1>
          <p className="text-sm text-gray-500 mt-1">
            {records.length} record{records.length !== 1 ? 's' : ''} written
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg">No records yet</p>
          <p className="text-sm mt-1">
            After a consultation, visit the appointment to add notes and prescriptions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const appt = apptMap.get(String(record.appointmentId));
            const patient = patientMap.get(String(record.patientId)) as {
              name?: string;
              profilePictureUrl?: string;
            } | undefined;
            const isEditable = now - record.createdAt.getTime() <= EDIT_WINDOW_MS;

            return (
              <Link
                key={String(record._id)}
                href={`/doctor/records/${String(record.appointmentId)}`}
                className="block"
              >
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="py-4 flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      {patient?.profilePictureUrl && (
                        <AvatarImage src={patient.profilePictureUrl} alt={patient.name} />
                      )}
                      <AvatarFallback className="bg-sky-100 text-sky-700 text-sm font-semibold">
                        {patient?.name ? initials(patient.name) : 'PT'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">
                          {patient?.name ?? 'Unknown Patient'}
                        </p>
                        {isEditable ? (
                          <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                            Editable
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Locked
                          </Badge>
                        )}
                      </div>
                      {record.diagnosis && (
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          Dx: {record.diagnosis}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {appt
                          ? new Date(appt.scheduledAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(record.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                        {record.prescriptions && record.prescriptions.length > 0 &&
                          ` · ${record.prescriptions.length} prescription${record.prescriptions.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>

                    <Plus className="h-4 w-4 text-gray-400 rotate-45 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
