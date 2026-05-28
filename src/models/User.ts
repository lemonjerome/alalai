import mongoose, { Document, Model, Schema } from 'mongoose';
import type { UserRole } from '@/types';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  phone: string;
  profilePictureUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    profilePictureUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

const UserModel: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;
