import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { NotificationType } from '@/types';

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_reminder',
        'appointment_cancelled',
        'appointment_rescheduled',
        'record_available',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Compound index for efficient unread queries per user
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;
