'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';
import type { EnrichedMedicalRecord } from '@/hooks/usePatientRecords';

interface AppointmentHistoryProps {
  records: EnrichedMedicalRecord[];
}

export function AppointmentHistory({ records }: AppointmentHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-lg">No medical records yet</p>
        <p className="text-sm mt-1">
          Records will appear here after your first consultation.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-200" aria-hidden="true" />

      <ol className="space-y-4">
        {records.map((record) => {
          const scheduledAt = record.appointment?.scheduledAt
            ? new Date(record.appointment.scheduledAt)
            : new Date(record.createdAt);

          const doctorName = (record.doctor as { name?: string } | undefined)?.name;

          return (
            <li key={record._id} className="relative flex gap-4 pl-12">
              {/* Dot */}
              <div
                className="absolute left-4 top-2 h-3 w-3 rounded-full bg-sky-500 ring-2 ring-white"
                aria-hidden="true"
              />

              <Link
                href={`/records/${record.appointmentId}`}
                className="flex-1 group rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow hover:border-sky-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {scheduledAt.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {doctorName && (
                      <p className="text-sm text-gray-500 mt-0.5">Dr. {doctorName}</p>
                    )}
                    {record.diagnosis && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-1">
                        <span className="font-medium">Dx:</span> {record.diagnosis}
                      </p>
                    )}
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {record.prescriptions.length} prescription{record.prescriptions.length !== 1 ? 's' : ''}
                        </Badge>
                        {record.followUpDate && (
                          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Follow-up scheduled
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 group-hover:text-sky-500 transition-colors mt-0.5" />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
