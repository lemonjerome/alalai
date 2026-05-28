import { z } from 'zod';

export const updateDoctorProfileSchema = z.object({
  // User fields (passed through to User model)
  name: z.string().min(2).trim().optional(),
  phone: z.string().trim().optional(),
  // DoctorProfile fields
  licenseNumber: z.string().trim().optional(),
  specialization: z.array(z.string().min(1)).min(1).optional(),
  bio: z.string().trim().optional(),
  education: z.array(z.string().trim()).optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  isAcceptingPatients: z.boolean().optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:mm format (e.g. 09:00)'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:mm format (e.g. 17:00)'),
  slotDurationMinutes: z.number().int().min(15).max(120).default(30),
  isActive: z.boolean().default(true),
  blockedDates: z.array(z.string().datetime({ offset: true })).optional().default([]),
});

export const updateAvailabilitySlotSchema = availabilitySlotSchema.partial();

export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>;
