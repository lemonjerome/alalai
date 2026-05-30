'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Star, Clock, PhilippinePeso, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DoctorSummary } from '@/hooks/useDoctors';

interface DoctorCardProps {
  doctor: DoctorSummary;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const { user, doctorProfile, nextAvailableSlot } = doctor;

  const nextSlotLabel = nextAvailableSlot
    ? new Date(nextAvailableSlot).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="pt-6 flex-1">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={user.profilePictureUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(user.name ?? 'DR')}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate">Dr. {user.name}</h3>
              {doctorProfile.isVerified && (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-label="Verified" />
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {doctorProfile.specialization.slice(0, 2).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
              {doctorProfile.specialization.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{doctorProfile.specialization.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {doctorProfile.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{doctorProfile.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-medium text-gray-700">
              {(doctorProfile.rating ?? 0).toFixed(1)}
            </span>
            <span className="text-gray-400">({doctorProfile.reviewCount})</span>
          </span>

          <span className="flex items-center gap-1 text-gray-600">
            <PhilippinePeso className="h-3.5 w-3.5" />
            <span>{doctorProfile.consultationFee.toLocaleString()}</span>
          </span>

          {doctorProfile.yearsOfExperience > 0 && (
            <span className="text-gray-500">{doctorProfile.yearsOfExperience}yr exp</span>
          )}
        </div>

        {nextSlotLabel && (
          <p className="mt-2 flex items-center gap-1 text-xs text-primary">
            <Clock className="h-3 w-3" />
            Next available: today at {nextSlotLabel}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-4 pb-5 px-5">
        <Link
          href={`/doctors/${doctorProfile._id}`}
          className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}
        >
          View Profile &amp; Book
        </Link>
      </CardFooter>
    </Card>
  );
}
