import { z } from 'zod';

export const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Medication name is required').trim(),
  dosage: z.string().min(1, 'Dosage is required').trim(),
  frequency: z.string().min(1, 'Frequency is required').trim(),
  duration: z.string().min(1, 'Duration is required').trim(),
  instructions: z.string().trim().optional().default(''),
});

export const createMedicalRecordSchema = z.object({
  consultationNotes: z.string().trim().optional().default(''),
  diagnosis: z.string().trim().optional().default(''),
  prescriptions: z.array(prescriptionSchema).optional().default([]),
  followUpDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .default(null),
  attachments: z.array(z.string().url()).optional().default([]),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial();

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
