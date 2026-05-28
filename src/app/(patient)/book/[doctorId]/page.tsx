'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoctor } from '@/hooks/useDoctors';
import { BookingWizard } from '@/components/appointments/BookingWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ doctorId: string }>;
}

export default function BookPage({ params }: PageProps) {
  const { doctorId } = use(params);
  const searchParams = useSearchParams();
  const initialSlot = searchParams.get('slot') ?? undefined;

  const { data, isLoading, isError } = useDoctor(doctorId);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">
        Doctor not found.
        <Link href="/doctors" className="block text-primary hover:underline mt-2">
          Back to search
        </Link>
      </div>
    );
  }

  const { user, doctorProfile } = data;

  // Use the slot duration from the first active availability or default 30
  const durationMinutes = 30;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <Link
        href={`/doctors/${doctorId}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Consultation</h1>
        <p className="text-gray-500 mt-1">
          with Dr. {user.name} · {doctorProfile.specialization.join(', ')}
        </p>
      </div>

      <BookingWizard
        doctorId={doctorId}
        doctorName={user.name}
        durationMinutes={durationMinutes}
        initialSlot={initialSlot}
      />
    </div>
  );
}
