import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import type { NotificationType } from '@/types';

interface SendParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Creates a notification DB record and triggers a Pusher event on the
 * user's private channel. Fails gracefully — a Pusher error does not
 * prevent the notification from being stored.
 */
async function send(params: SendParams): Promise<void> {
  await connectDB();

  const notification = await Notification.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data ?? {},
    isRead: false,
  });

  // Push real-time event (best-effort)
  try {
    const { getPusherServer } = await import('@/lib/pusher');
    const pusher = getPusherServer();
    await pusher.trigger(`private-user-${params.userId}`, 'notification', {
      _id: String(notification._id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: false,
      createdAt: notification.createdAt,
    });
  } catch {
    // Pusher not configured (local dev) — silently skip
  }
}

export const NotificationService = {
  send,

  async sendAppointmentBooked(params: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    patientName: string;
    appointmentId: string;
    scheduledAt: Date;
  }): Promise<void> {
    const dateLabel = params.scheduledAt.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await Promise.all([
      send({
        userId: params.patientId,
        type: 'appointment_booked',
        title: 'Appointment Confirmed',
        message: `Your consultation with Dr. ${params.doctorName} is confirmed for ${dateLabel}.`,
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_booked',
        title: 'New Appointment',
        message: `New appointment from ${params.patientName} on ${dateLabel}.`,
        data: { appointmentId: params.appointmentId },
      }),
    ]);
  },

  async sendAppointmentCancelled(params: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    patientName: string;
    appointmentId: string;
    scheduledAt: Date;
    cancelledBy: 'patient' | 'doctor';
    reason: string;
  }): Promise<void> {
    const dateLabel = params.scheduledAt.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const cancellerLabel = params.cancelledBy === 'patient' ? params.patientName : `Dr. ${params.doctorName}`;

    await Promise.all([
      send({
        userId: params.patientId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Your appointment for ${dateLabel} was cancelled by ${cancellerLabel}. Reason: ${params.reason}`,
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Appointment with ${params.cancelledBy === 'patient' ? params.patientName : 'patient'} on ${dateLabel} was cancelled. Reason: ${params.reason}`,
        data: { appointmentId: params.appointmentId },
      }),
    ]);
  },

  async sendAppointmentRescheduled(params: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    patientName: string;
    newAppointmentId: string;
    newScheduledAt: Date;
  }): Promise<void> {
    const dateLabel = params.newScheduledAt.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await Promise.all([
      send({
        userId: params.patientId,
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `Your appointment has been rescheduled to ${dateLabel}.`,
        data: { appointmentId: params.newAppointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `${params.patientName} rescheduled their appointment to ${dateLabel}.`,
        data: { appointmentId: params.newAppointmentId },
      }),
    ]);
  },

  async sendAppointmentReminder(params: {
    userId: string;
    recipientName: string;
    otherName: string;
    appointmentId: string;
    scheduledAt: Date;
    role: 'patient' | 'doctor';
  }): Promise<void> {
    const dateLabel = params.scheduledAt.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const otherLabel = params.role === 'patient' ? `Dr. ${params.otherName}` : params.otherName;

    await send({
      userId: params.userId,
      type: 'appointment_reminder',
      title: 'Appointment Tomorrow',
      message: `Reminder: you have a consultation with ${otherLabel} tomorrow at ${dateLabel}.`,
      data: { appointmentId: params.appointmentId },
    });
  },

  async sendRecordAvailable(params: {
    patientId: string;
    doctorName: string;
    appointmentId: string;
  }): Promise<void> {
    await send({
      userId: params.patientId,
      type: 'record_available',
      title: 'Medical Record Available',
      message: `Dr. ${params.doctorName} has added your consultation notes and prescription.`,
      data: { appointmentId: params.appointmentId },
    });
  },
};
