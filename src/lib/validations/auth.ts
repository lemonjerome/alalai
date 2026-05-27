import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const baseRegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  phone: z.string().optional().default(''),
});

export const registerPatientSchema = baseRegisterSchema
  .extend({
    role: z.literal('patient'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerDoctorSchema = baseRegisterSchema
  .extend({
    role: z.literal('doctor'),
    licenseNumber: z.string().min(1, 'License number is required').trim(),
    specialization: z
      .array(z.string().min(1))
      .min(1, 'At least one specialization is required'),
    yearsOfExperience: z
      .number()
      .int()
      .min(0, 'Years of experience cannot be negative')
      .optional()
      .default(0),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Union type for the registration endpoint
export const registerSchema = z.discriminatedUnion('role', [
  registerPatientSchema,
  registerDoctorSchema,
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
