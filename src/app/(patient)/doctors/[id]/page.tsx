'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctor } from '@/hooks/useDoctors';
import { AvailabilityCalendar } from '@/components/doctors/AvailabilityCalendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Star, GraduationCap, CheckCircle2, PhilippinePeso } from 'lucide-react';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DoctorDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useDoctor(id);

  const handleSelectSlot = (startISO: string) => {
    router.push(`/book/${id}?slot=${encodeURIComponent(startISO)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Doctor not found.</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const { user, doctorProfile } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src={user.profilePictureUrl} alt={user.name} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {initials(user.name ?? 'DR')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Dr. {user.name}</h1>
                {doctorProfile.isVerified && (
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Verified" />
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {doctorProfile.specialization.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <strong>{doctorProfile.rating.toFixed(1)}</strong>
                  <span className="text-gray-400">({doctorProfile.reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1">
                  <PhilippinePeso className="h-4 w-4" />
                  <strong>₱{doctorProfile.consultationFee.toLocaleString()}</strong>
                  <span className="text-gray-400">/ session</span>
                </span>
                {doctorProfile.yearsOfExperience > 0 && (
                  <span>{doctorProfile.yearsOfExperience} years experience</span>
                )}
              </div>

              {doctorProfile.bio && (
                <p className="mt-3 text-gray-700 leading-relaxed">{doctorProfile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education */}
        {doctorProfile.education.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {doctorProfile.education.map((edu, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {edu}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* License */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">License & Credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <div>
              <span className="font-medium">License No:</span> {doctorProfile.licenseNumber}
            </div>
            <div>
              <span className="font-medium">Status:</span>{' '}
              {doctorProfile.isVerified ? (
                <span className="text-green-600">Verified ✓</span>
              ) : (
                <span className="text-gray-400">Pending verification</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Booking calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Book a Consultation</CardTitle>
          <p className="text-sm text-gray-500">
            Select an available date and time to continue booking
          </p>
        </CardHeader>
        <CardContent>
          {doctorProfile.isAcceptingPatients ? (
            <AvailabilityCalendar
              doctorId={doctorProfile._id}
              onSelectSlot={(startISO) => handleSelectSlot(startISO)}
            />
          ) : (
            <p className="text-gray-500 text-sm">
              This doctor is not currently accepting new appointments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
