import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IAvailabilityDocument extends Document {
  doctorId: Types.ObjectId; // ref: DoctorProfile
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // 'HH:mm' e.g. '09:00'
  endTime: string; // 'HH:mm' e.g. '17:00'
  slotDurationMinutes: number;
  isActive: boolean;
  blockedDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailabilityDocument>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    slotDurationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 15,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    blockedDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'availabilities',
  }
);

// Compound index: one rule per doctor per day
AvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

const AvailabilityModel: Model<IAvailabilityDocument> =
  mongoose.models.Availability ??
  mongoose.model<IAvailabilityDocument>('Availability', AvailabilitySchema);

export default AvailabilityModel;
