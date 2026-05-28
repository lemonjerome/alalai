'use client';

import { useQuery } from '@tanstack/react-query';

export interface SlotRange {
  startISO: string;
  endISO: string;
}

export type AvailabilityByDate = Record<string, SlotRange[]>;

async function fetchAvailability(
  doctorId: string,
  from: string,
  to: string
): Promise<AvailabilityByDate> {
  const query = new URLSearchParams({ from, to });
  const res = await fetch(`/api/doctors/${doctorId}/availability?${query}`);
  if (!res.ok) throw new Error('Failed to fetch availability');
  const data = await res.json() as { availability: AvailabilityByDate };
  return data.availability;
}

export function useDoctorAvailability(doctorId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['doctorAvailability', doctorId, from, to],
    queryFn: () => fetchAvailability(doctorId, from, to),
    staleTime: 2 * 60 * 1000,
    enabled: !!doctorId && !!from && !!to,
  });
}
