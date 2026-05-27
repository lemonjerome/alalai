/**
 * Shared TypeScript interfaces for AlalAI domain entities.
 * These are plain objects (not Mongoose documents) used for API responses
 * and client-side code.
 */

export type UserRole = 'patient' | 'doctor';

export interface IUser {
  _id: string;
  email: string;
  role: UserRole;
  name: string;
  phone: string;
  profilePictureUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPatientProfile {
  _id: string;
  userId: string;
  dateOfBirth: string;
  weight: number; // kg
  height: number; // cm
  bloodType: string;
  allergies: string[];
  currentMedications: string[];
  medicalHistory: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IDoctorProfile {
  _id: string;
  userId: string;
  licenseNumber: string;
  specialization: string[];
  bio: string;
  education: string[];
  yearsOfExperience: number;
  consultationFee: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAcceptingPatients: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAvailability {
  _id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  slotDurationMinutes: number;
  isActive: boolean;
  blockedDates: string[];
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface IAppointment {
  _id: string;
  patientId: string;
  doctorId: string;
  doctorProfileId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  cancellationReason: string;
  rescheduledFrom: string | null;
  jitsiRoomId: string;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPrescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IMedicalRecord {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  consultationNotes: string;
  diagnosis: string;
  prescriptions: IPrescription[];
  followUpDate: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'appointment_booked'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'record_available';

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

/** Time slot returned by availability utils */
export interface TimeSlot {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  label: string; // '09:00 AM'
}

/** Doctor card shown in discovery */
export interface DoctorWithProfile {
  user: IUser;
  doctorProfile: IDoctorProfile;
  nextAvailableSlot: string | null;
}
