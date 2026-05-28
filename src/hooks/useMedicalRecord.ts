import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMedicalRecordInput, UpdateMedicalRecordInput } from '@/lib/validations/medicalRecord';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface MedicalRecord {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  consultationNotes?: string;
  diagnosis?: string;
  prescriptions: Prescription[];
  followUpDate?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

export function isRecordEditable(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= EDIT_WINDOW_MS;
}

async function fetchRecord(appointmentId: string): Promise<MedicalRecord | null> {
  const res = await fetch(`/api/medical-records/${appointmentId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const json = (await res.json()) as { error?: string };
    throw new Error(json.error ?? 'Failed to fetch record');
  }
  const json = (await res.json()) as { record: MedicalRecord };
  return json.record;
}

export function useMedicalRecord(appointmentId: string) {
  return useQuery({
    queryKey: ['medicalRecord', appointmentId],
    queryFn: () => fetchRecord(appointmentId),
    staleTime: 0,
    enabled: !!appointmentId,
  });
}

export function useCreateMedicalRecord(appointmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMedicalRecordInput) => {
      const res = await fetch(`/api/medical-records/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Failed to create record');
      }
      const json = (await res.json()) as { record: MedicalRecord };
      return json.record;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medicalRecord', appointmentId] });
      void queryClient.invalidateQueries({ queryKey: ['patientRecords'] });
    },
  });
}

export function useUpdateMedicalRecord(appointmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMedicalRecordInput) => {
      const res = await fetch(`/api/medical-records/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Failed to update record');
      }
      const json = (await res.json()) as { record: MedicalRecord };
      return json.record;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medicalRecord', appointmentId] });
      void queryClient.invalidateQueries({ queryKey: ['patientRecords'] });
    },
  });
}
