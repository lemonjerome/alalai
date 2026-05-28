import { Suspense } from 'react';
import { DoctorFilters } from '@/components/doctors/DoctorFilters';
import { DoctorGrid } from '@/components/doctors/DoctorGrid';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Find a Doctor — AlalAI' };

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-9 w-full mt-4" />
        </div>
      ))}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-500 mt-1">Browse specialists and book a consultation</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-xl border p-4 sticky top-4">
              <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <DoctorFilters />
              </Suspense>
            </div>
          </aside>

          {/* Doctor grid */}
          <main className="flex-1 min-w-0">
            <Suspense fallback={<GridSkeleton />}>
              <DoctorGrid />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
