'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IAppointmentDocument } from '@/models/Appointment';

export type AppointmentWithId = Omit<IAppointmentDocument, keyof Document> & { _id: string };

interface AppointmentsResponse {
  appointments: AppointmentWithId[];
  total: number;
  page: number;
  pages: number;
}

// ── Patient: fetch own appointments ──────────────────────────────────────────

async function fetchMyAppointments(status?: string): Promise<AppointmentsResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(`/api/appointments?${params}`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json() as Promise<AppointmentsResponse>;
}

export function useMyAppointments(status?: string) {
  return useQuery({
    queryKey: ['appointments', 'patient', status],
    queryFn: () => fetchMyAppointments(status),
    staleTime: 0,
  });
}

// ── Doctor: fetch own appointments ────────────────────────────────────────────

async function fetchDoctorAppointments(params: {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
}): Promise<AppointmentsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.page) qs.set('page', String(params.page));
  const res = await fetch(`/api/doctors/me/appointments?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json() as Promise<AppointmentsResponse>;
}

export function useDoctorAppointments(params: {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: ['appointments', 'doctor', params],
    queryFn: () => fetchDoctorAppointments(params),
    staleTime: 0,
  });
}

// ── Book appointment ─────────────────────────────────────────────────────────

interface BookInput {
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BookInput) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Booking failed');
      }
      return res.json() as Promise<{ appointment: AppointmentWithId }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['doctorAvailability'] });
    },
  });
}

// ── Cancel appointment ───────────────────────────────────────────────────────

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: reason }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Cancellation failed');
      }
      return res.json() as Promise<{ appointment: AppointmentWithId }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// ── Reschedule appointment (patient) ─────────────────────────────────────────

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduledAt, durationMinutes }: { id: string; scheduledAt: string; durationMinutes: number }) => {
      const res = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt, durationMinutes }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Rescheduling failed');
      }
      return res.json() as Promise<{ appointment: AppointmentWithId }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['doctorAvailability'] });
    },
  });
}

// ── Complete appointment (doctor) ────────────────────────────────────────────

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Failed to mark complete');
      }
      return res.json() as Promise<{ appointment: AppointmentWithId }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
