'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UpdateUserInput, UpdatePatientProfileInput } from '@/lib/validations/user';

export const CURRENT_USER_KEY = ['currentUser'] as const;
export const PATIENT_PROFILE_KEY = ['patientProfile'] as const;

// ── Fetch current user + profile ──────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      const res = await fetch('/api/users/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json() as Promise<{ user: Record<string, unknown>; profile: Record<string, unknown> | null }>;
    },
    staleTime: 5 * 60 * 1000, // 5 min — user data changes rarely
  });
}

// ── Update user (name, phone) ─────────────────────────────────────────────────

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? 'Update failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      toast.success('Profile updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Update patient health profile ─────────────────────────────────────────────

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdatePatientProfileInput) => {
      const res = await fetch('/api/users/me/patient-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? 'Update failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      queryClient.invalidateQueries({ queryKey: PATIENT_PROFILE_KEY });
      toast.success('Health info updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ── Upload avatar ─────────────────────────────────────────────────────────────

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? 'Upload failed');
      }
      return res.json() as Promise<{ profilePictureUrl: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      toast.success('Avatar updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
