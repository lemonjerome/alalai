import { z } from 'zod';

export const SUPPORTED_SPECIALIZATIONS = [
  'General Practitioner',
  'Pediatrics',
  'Dermatology',
  'Mental Health',
  'Cardiology',
] as const;

export type SupportedSpecialization = (typeof SUPPORTED_SPECIALIZATIONS)[number];

export const recommendRequestSchema = z.object({
  symptoms: z
    .string()
    .min(10, 'Please describe your symptoms in at least 10 characters.')
    .max(1000, 'Please keep your description under 1000 characters.')
    .trim(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;

export const ollamaResponseSchema = z.object({
  specialization: z.enum(SUPPORTED_SPECIALIZATIONS),
  reasoning: z.string().min(1),
});

export type OllamaResponse = z.infer<typeof ollamaResponseSchema>;

export interface RecommendedDoctor {
  _id: string;
  name: string;
  profilePictureUrl: string;
  doctorProfileId: string;
  specialization: string[];
  bio: string;
  yearsOfExperience: number;
  consultationFee: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export interface RecommendResponse {
  specialization: SupportedSpecialization;
  reasoning: string;
  doctors: RecommendedDoctor[];
}
