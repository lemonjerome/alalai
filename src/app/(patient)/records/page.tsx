'use client';

import { useState } from 'react';
import { usePatientRecords } from '@/hooks/usePatientRecords';
import { AppointmentHistory } from '@/components/medical-records/AppointmentHistory';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function RecordsSkeleton() {
  return (
    <div className="space-y-4 pl-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

export default function PatientRecordsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePatientRecords(page);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your complete consultation history
        </p>
      </div>

      {isLoading && <RecordsSkeleton />}

      {isError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Failed to load medical records. Please try again.
        </div>
      )}

      {data && (
        <>
          <AppointmentHistory records={data.records} />

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {data.page} of {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
