import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { IPrescription } from '@/types';

interface PrescriptionSubdoc extends IPrescription {
  _id?: Types.ObjectId;
}

export interface IMedicalRecordDocument extends Document {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  consultationNotes: string;
  diagnosis: string;
  prescriptions: PrescriptionSubdoc[];
  followUpDate: Date | null;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema(
  {
    medication: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const MedicalRecordSchema = new Schema<IMedicalRecordDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true, // One record per appointment
      index: true,
    },
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
    consultationNotes: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
      trim: true,
    },
    prescriptions: {
      type: [PrescriptionSchema],
      default: [],
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'medical_records',
  }
);

const MedicalRecordModel: Model<IMedicalRecordDocument> =
  mongoose.models.MedicalRecord ??
  mongoose.model<IMedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);

export default MedicalRecordModel;
