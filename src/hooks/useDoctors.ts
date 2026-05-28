'use client';

import { useQuery } from '@tanstack/react-query';

export interface DoctorSummary {
  user: {
    _id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  doctorProfile: {
    _id: string;
    userId: string;
    licenseNumber: string;
    specialization: string[];
    bio: string;
    education: string[];
    yearsOfExperience: number;
    consultationFee: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isAcceptingPatients: boolean;
  };
  nextAvailableSlot: string | null;
}

export interface DoctorsResponse {
  doctors: DoctorSummary[];
  total: number;
  page: number;
  pages: number;
}

interface UseDoctorsParams {
  search?: string;
  specialization?: string;
  availableOn?: string;
  page?: number;
  limit?: number;
}

async function fetchDoctors(params: UseDoctorsParams): Promise<DoctorsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.specialization) query.set('specialization', params.specialization);
  if (params.availableOn) query.set('availableOn', params.availableOn);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`/api/doctors?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch doctors');
  return res.json() as Promise<DoctorsResponse>;
}

export function useDoctors(params: UseDoctorsParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => fetchDoctors(params),
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchDoctor(id: string): Promise<DoctorSummary> {
  const res = await fetch(`/api/doctors/${id}`);
  if (!res.ok) throw new Error('Failed to fetch doctor');
  const data = await res.json() as { user: DoctorSummary['user']; doctorProfile: DoctorSummary['doctorProfile'] };
  return { user: data.user, doctorProfile: data.doctorProfile, nextAvailableSlot: null };
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => fetchDoctor(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}
