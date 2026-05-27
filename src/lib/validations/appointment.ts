import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: z
    .string()
    .datetime({ offset: true, message: 'Must be a valid ISO 8601 datetime' }),
  durationMinutes: z.number().int().min(15).max(120).default(30),
});

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ offset: true, message: 'Must be a valid ISO 8601 datetime' }),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z
    .string()
    .min(5, 'Please provide a reason for cancellation (at least 5 characters)')
    .trim(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
