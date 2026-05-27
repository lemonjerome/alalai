import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IDoctorProfileDocument extends Document {
  userId: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: [String],
      default: [],
      index: true,
    },
    bio: {
      type: String,
      default: '',
    },
    education: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAcceptingPatients: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'doctor_profiles',
  }
);

// Text index for full-text search on bio and specialization
DoctorProfileSchema.index({ bio: 'text', specialization: 'text' });

const DoctorProfileModel: Model<IDoctorProfileDocument> =
  mongoose.models.DoctorProfile ??
  mongoose.model<IDoctorProfileDocument>('DoctorProfile', DoctorProfileSchema);

export default DoctorProfileModel;
