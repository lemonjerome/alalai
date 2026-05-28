import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import MedicalRecord from '@/models/MedicalRecord';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { sanitizeUser } from '@/lib/utils';
import { PrescriptionCard } from '@/components/medical-records/PrescriptionCard';
import { PrintButton } from '@/components/medical-records/PrintButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { IMedicalRecordDocument } from '@/models/MedicalRecord';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';

export default async function PatientRecordDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'patient') redirect('/doctor/dashboard');

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    notFound();
  }

  await connectDB();

  const [record, appointment] = await Promise.all([
    MedicalRecord.findOne({ appointmentId }).lean<IMedicalRecordDocument>(),
    Appointment.findById(appointmentId).lean<IAppointmentDocument>(),
  ]);

  if (!record || !appointment) notFound();

  // Patient must own this record
  if (String(record.patientId) !== session.user.id) {
    redirect('/records');
  }

  const doctorUser = await User.findById(record.doctorId)
    .select('name email')
    .lean<IUserDocument>();

  const doctor = doctorUser ? sanitizeUser(doctorUser) : null;
  const doctorName = (doctor as { name?: string } | null)?.name ?? 'Doctor';
  const patientName = session.user.name ?? 'Patient';

  const scheduledAt = new Date(appointment.scheduledAt);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/records"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Records
        </Link>

        {record.prescriptions && record.prescriptions.length > 0 && <PrintButton />}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Record</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-sm text-gray-500">
            Dr. {doctorName} ·{' '}
            {scheduledAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <Badge variant="secondary" className="text-xs">
            {appointment.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Diagnosis & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnosis & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.diagnosis && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Diagnosis
                </p>
                <p className="text-sm text-gray-900 font-medium">{record.diagnosis}</p>
              </div>
            )}
            {record.consultationNotes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Consultation Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {record.consultationNotes}
                </p>
              </div>
            )}
            {record.followUpDate && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2">
                <Calendar className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">Follow-Up Recommended</p>
                  <p className="text-sm text-green-800 mt-0.5">
                    {new Date(record.followUpDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
            {!record.diagnosis && !record.consultationNotes && (
              <p className="text-sm text-gray-400 italic">
                No notes recorded for this consultation.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prescription Card */}
        {record.prescriptions && record.prescriptions.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Prescriptions</h2>
            <PrescriptionCard
              prescriptions={record.prescriptions}
              doctorName={doctorName}
              patientName={patientName}
              consultationDate={appointment.scheduledAt.toISOString()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
