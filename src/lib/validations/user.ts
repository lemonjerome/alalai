import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  phone: z.string().trim().optional(),
  profilePictureUrl: z.string().url('Invalid URL').optional(),
});

export const updatePatientProfileSchema = z.object({
  dateOfBirth: z.string().datetime({ offset: true }).optional().nullable(),
  weight: z.number().min(0, 'Weight cannot be negative').optional(),
  height: z.number().min(0, 'Height cannot be negative').optional(),
  bloodType: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
    .optional(),
  allergies: z.array(z.string().trim()).optional(),
  currentMedications: z.array(z.string().trim()).optional(),
  medicalHistory: z.string().trim().optional(),
  emergencyContact: z
    .object({
      name: z.string().trim(),
      phone: z.string().trim(),
      relationship: z.string().trim(),
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;
