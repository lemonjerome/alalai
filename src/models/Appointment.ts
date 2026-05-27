import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { AppointmentStatus } from '@/types';

export interface IAppointmentDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  doctorProfileId: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  cancellationReason: string;
  rescheduledFrom: Types.ObjectId | null;
  jitsiRoomId: string;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 15,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'confirmed',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    rescheduledFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    jitsiRoomId: {
      type: String,
      required: true,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'appointments',
  }
);

// Compound indexes for efficient querying
AppointmentSchema.index({ patientId: 1, scheduledAt: -1 });
AppointmentSchema.index({ doctorId: 1, scheduledAt: -1 });
AppointmentSchema.index({ doctorId: 1, scheduledAt: 1, status: 1 });

const AppointmentModel: Model<IAppointmentDocument> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default AppointmentModel;
