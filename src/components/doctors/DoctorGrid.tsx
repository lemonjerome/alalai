'use client';

import { useDoctors } from '@/hooks/useDoctors';
import { DoctorCard } from '@/components/doctors/DoctorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Stethoscope } from 'lucide-react';

function DoctorCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-9 w-full mt-4" />
    </div>
  );
}

export function DoctorGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = {
    search: searchParams.get('search') ?? undefined,
    specialization: searchParams.get('specialization') ?? undefined,
    availableOn: searchParams.get('availableOn') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
  };

  const { data, isLoading, isError } = useDoctors(params);

  const goToPage = (page: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('page', String(page));
    router.push(`${pathname}?${sp.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <DoctorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Failed to load doctors. Please try again.</p>
      </div>
    );
  }

  if (!data || data.doctors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium text-gray-500">No doctors found</p>
        <p className="text-sm mt-1">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Showing {data.doctors.length} of {data.total} doctor{data.total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.doctors.map((doctor) => (
          <DoctorCard key={doctor.doctorProfile._id} doctor={doctor} />
        ))}
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={params.page <= 1}
            onClick={() => goToPage(params.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {params.page} of {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={params.page >= data.pages}
            onClick={() => goToPage(params.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
