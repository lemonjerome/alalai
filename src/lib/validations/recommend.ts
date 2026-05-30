import { z } from 'zod';

export const recommendRequestSchema = z.object({
  symptoms: z
    .string()
    .min(10, 'Please describe your symptoms in at least 10 characters.')
    .max(1000, 'Please keep your description under 1000 characters.')
    .trim(),
});

export type RecommendRequest = z.infer<typeof recommendRequestSchema>;

export const ollamaResponseSchema = z.object({
  specializations: z.array(z.string()).min(1),
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

export interface SpecializationGroup {
  topRated: RecommendedDoctor[];
  mostAvailable: RecommendedDoctor[];
}

export interface RecommendResponse {
  specializations: string[];
  reasoning: string;
  bySpecialization: Record<string, SpecializationGroup>;
}
