import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import type { NotificationType } from '@/types';

interface SendParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

async function send(params: SendParams): Promise<void> {
  await connectDB();

  const notification = await Notification.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? '',
    data: params.data ?? {},
    isRead: false,
  });

  try {
    const { getPusherServer } = await import('@/lib/pusher');
    const pusher = getPusherServer();
    await pusher.trigger(`private-user-${params.userId}`, 'notification', {
      _id: String(notification._id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      data: notification.data,
      isRead: false,
      createdAt: notification.createdAt,
    });
  } catch {
    // Pusher not configured — silently skip
  }
}

export const NotificationService = {
  send,

  /** Patient books → doctor gets request notification, patient gets "sent" confirmation */
  async sendBookingRequest(params: {
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
        type: 'appointment_request',
        title: 'Booking Request Sent',
        message: `Your booking request was sent to Dr. ${params.doctorName} for ${dateLabel}. Waiting for confirmation.`,
        link: '/appointments',
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_request',
        title: 'New Booking Request',
        message: `${params.patientName} has requested an appointment on ${dateLabel}.`,
        link: '/doctor/appointments',
        data: { appointmentId: params.appointmentId },
      }),
    ]);
  },

  /** Doctor confirms a pending appointment */
  async sendAppointmentConfirmed(params: {
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
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Dr. ${params.doctorName} confirmed your appointment for ${dateLabel}.`,
        link: '/appointments',
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_confirmed',
        title: 'Appointment Accepted',
        message: `You confirmed the appointment with ${params.patientName} on ${dateLabel}.`,
        link: '/doctor/appointments',
        data: { appointmentId: params.appointmentId },
      }),
    ]);
  },

  /** Doctor rejects a pending appointment */
  async sendAppointmentRejected(params: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    patientName: string;
    appointmentId: string;
    scheduledAt: Date;
    reason: string;
  }): Promise<void> {
    const dateLabel = params.scheduledAt.toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await Promise.all([
      send({
        userId: params.patientId,
        type: 'appointment_rejected',
        title: 'Booking Request Declined',
        message: `Dr. ${params.doctorName} declined your request for ${dateLabel}. Reason: ${params.reason}`,
        link: '/appointments',
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_rejected',
        title: 'Appointment Declined',
        message: `You declined the booking request from ${params.patientName} for ${dateLabel}.`,
        link: '/doctor/appointments',
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
    const cancellerLabel =
      params.cancelledBy === 'patient' ? params.patientName : `Dr. ${params.doctorName}`;

    await Promise.all([
      send({
        userId: params.patientId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Your appointment for ${dateLabel} was cancelled by ${cancellerLabel}. Reason: ${params.reason}`,
        link: '/appointments',
        data: { appointmentId: params.appointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Appointment with ${params.cancelledBy === 'patient' ? params.patientName : 'patient'} on ${dateLabel} was cancelled. Reason: ${params.reason}`,
        link: '/doctor/appointments',
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
        link: '/appointments',
        data: { appointmentId: params.newAppointmentId },
      }),
      send({
        userId: params.doctorId,
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `${params.patientName} rescheduled their appointment to ${dateLabel}.`,
        link: '/doctor/appointments',
        data: { appointmentId: params.newAppointmentId },
      }),
    ]);
  },

  async sendAppointmentReminder(params: {
    userId: string;
    otherName: string;
    appointmentId: string;
    scheduledAt: Date;
    role: 'patient' | 'doctor';
  }): Promise<void> {
    const timeLabel = params.scheduledAt.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const otherLabel = params.role === 'patient' ? `Dr. ${params.otherName}` : params.otherName;
    const link =
      params.role === 'patient'
        ? `/consultation/${params.appointmentId}`
        : `/consultation/${params.appointmentId}`;

    await send({
      userId: params.userId,
      type: 'appointment_reminder',
      title: 'Appointment in 30 Minutes',
      message: `Your consultation with ${otherLabel} starts at ${timeLabel}. Get ready to join.`,
      link,
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
      link: `/records/${params.appointmentId}`,
      data: { appointmentId: params.appointmentId },
    });
  },
};
