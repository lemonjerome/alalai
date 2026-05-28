import { useQuery } from '@tanstack/react-query';
import type { MedicalRecord } from './useMedicalRecord';

interface Appointment {
  _id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}

interface DoctorInfo {
  _id: string;
  name?: string;
  profilePictureUrl?: string;
}

export interface EnrichedMedicalRecord extends MedicalRecord {
  appointment?: Appointment;
  doctor?: DoctorInfo;
}

interface PatientRecordsResponse {
  records: EnrichedMedicalRecord[];
  total: number;
  page: number;
  pages: number;
}

async function fetchPatientRecords(page: number): Promise<PatientRecordsResponse> {
  const res = await fetch(`/api/medical-records?page=${page}&limit=10`);
  if (!res.ok) {
    const json = (await res.json()) as { error?: string };
    throw new Error(json.error ?? 'Failed to fetch records');
  }
  return res.json() as Promise<PatientRecordsResponse>;
}

export function usePatientRecords(page = 1) {
  return useQuery({
    queryKey: ['patientRecords', page],
    queryFn: () => fetchPatientRecords(page),
    staleTime: 0,
  });
}
