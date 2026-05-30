import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { MARITAL_STATUS_VALUES } from '@/lib/validations/user';

export type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];
export { MARITAL_STATUS_VALUES };

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface IPatientProfileDocument extends Document {
  userId: Types.ObjectId;
  dateOfBirth: Date;
  weight: number;
  height: number;
  bloodType: string;
  allergies: string[];
  currentMedications: string[];
  medicalHistory: string;
  address: string;
  maritalStatus: MaritalStatus;
  emergencyContact: EmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    weight: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    bloodType: {
      type: String,
      default: '',
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    },
    allergies: {
      type: [String],
      default: [],
    },
    currentMedications: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    maritalStatus: {
      type: String,
      default: '',
      enum: MARITAL_STATUS_VALUES,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    collection: 'patient_profiles',
  }
);

const PatientProfileModel: Model<IPatientProfileDocument> =
  mongoose.models.PatientProfile ??
  mongoose.model<IPatientProfileDocument>('PatientProfile', PatientProfileSchema);

export default PatientProfileModel;
