import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import mongoose from 'mongoose';
import { ConsultationClient } from './ConsultationClient';
import type { IAppointmentDocument } from '@/models/Appointment';
import type { IUserDocument } from '@/models/User';
import { sanitizeUser } from '@/lib/utils';

interface PageProps {
  params: Promise<{ appointmentId: string }>;
}

export default async function ConsultationPage({ params }: PageProps) {
  const { appointmentId } = await params;

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectDB();

  const appointment = await Appointment.findById(appointmentId).lean<IAppointmentDocument>();

  if (!appointment) {
    notFound();
  }

  // Ownership check
  const userId = session.user.id;
  const isPatient = String(appointment.patientId) === userId;
  const isDoctor = String(appointment.doctorId) === userId;

  if (!isPatient && !isDoctor) {
    redirect(isDoctor ? '/doctor/dashboard' : '/dashboard');
  }

  if (appointment.status === 'cancelled') {
    redirect(isDoctor ? '/doctor/appointments' : '/appointments');
  }

  const [patientUser, doctorUser] = await Promise.all([
    User.findById(appointment.patientId).select('name').lean<IUserDocument>(),
    User.findById(appointment.doctorId).select('name').lean<IUserDocument>(),
  ]);

  return (
    <ConsultationClient
      appointmentId={String(appointment._id)}
      jitsiRoomId={appointment.jitsiRoomId}
      scheduledAt={appointment.scheduledAt.toISOString()}
      durationMinutes={appointment.durationMinutes}
      patientName={sanitizeUser(patientUser!)?.name ?? 'Patient'}
      doctorName={sanitizeUser(doctorUser!)?.name ?? 'Doctor'}
      role={isDoctor ? 'doctor' : 'patient'}
      currentUserName={session.user.name ?? (isDoctor ? `Dr. ${doctorUser?.name}` : patientUser?.name ?? 'User')}
    />
  );
}
