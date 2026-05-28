import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import { MedicalRecordCard } from '@/components/medical-records/MedicalRecordCard';
import { ConsultationNotesForm } from '@/components/medical-records/ConsultationNotesForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { IMedicalRecordDocument } from '@/models/MedicalRecord';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

export default async function DoctorRecordDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'doctor') redirect('/dashboard');

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    notFound();
  }

  await connectDB();

  const [record, appointment] = await Promise.all([
    MedicalRecord.findOne({ appointmentId }).lean<IMedicalRecordDocument>(),
    Appointment.findById(appointmentId).lean<IAppointmentDocument>(),
  ]);

  if (!appointment) notFound();

  // Doctor must own the appointment
  if (String(appointment.doctorId) !== session.user.id) {
    redirect('/doctor/records');
  }

  // Fetch patient info
  const patientUser = await User.findById(appointment.patientId)
    .select('name email profilePictureUrl')
    .lean<IUserDocument>();

  const patient = patientUser ? sanitizeUser(patientUser) : null;
  const patientName = (patient as { name?: string } | null)?.name ?? 'Unknown Patient';

  const isEditable = record
    ? Date.now() - record.createdAt.getTime() <= EDIT_WINDOW_MS
    : false;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/doctor/records"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Records
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Record</h1>
        <p className="text-sm text-gray-500 mt-1">
          Patient: {patientName} ·{' '}
          {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {record ? (
        <div className="space-y-6">
          <MedicalRecordCard
            record={{
              _id: String(record._id),
              consultationNotes: record.consultationNotes,
              diagnosis: record.diagnosis,
              prescriptions: record.prescriptions,
              followUpDate: record.followUpDate?.toISOString(),
              createdAt: record.createdAt.toISOString(),
            }}
            patientName={patientName}
            isEditable={isEditable}
          />

          {isEditable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit Record</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsultationNotesForm
                  appointmentId={appointmentId}
                  mode="edit"
                  defaultValues={{
                    consultationNotes: record.consultationNotes ?? '',
                    diagnosis: record.diagnosis ?? '',
                    prescriptions: record.prescriptions ?? [],
                    followUpDate: record.followUpDate?.toISOString() ?? null,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {!isEditable && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              This record was created more than 72 hours ago and is now locked for editing.
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Consultation Record</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsultationNotesForm
              appointmentId={appointmentId}
              mode="create"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
