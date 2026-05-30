'use client';

import { useState } from 'react';
import { useRecommendDoctor } from '@/hooks/useRecommendDoctor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Brain,
  AlertCircle,
  Star,
  PhilippinePeso,
  CheckCircle2,
  Stethoscope,
  SendHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { RecommendedDoctor } from '@/lib/validations/recommend';

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function DoctorResultCard({ doctor }: { doctor: RecommendedDoctor }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow">
      <Avatar className="h-14 w-14 shrink-0">
        <AvatarImage src={doctor.profilePictureUrl} alt={doctor.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {initials(doctor.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">Dr. {doctor.name}</span>
          {doctor.isVerified && (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Verified" />
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          {doctor.specialization.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        {doctor.bio && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{doctor.bio}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-0.5 text-amber-500">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-medium text-gray-700">{doctor.rating.toFixed(1)}</span>
            <span className="text-gray-400">({doctor.reviewCount})</span>
          </span>
          <span className="flex items-center gap-0.5">
            <PhilippinePeso className="h-3 w-3" />
            {doctor.consultationFee.toLocaleString()}
          </span>
          {doctor.yearsOfExperience > 0 && (
            <span className="text-gray-400">{doctor.yearsOfExperience}yr exp</span>
          )}
        </div>
      </div>

      <Link
        href={`/doctors/${doctor.doctorProfileId}`}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'shrink-0 gap-1.5 self-start sm:self-center'
        )}
      >
        <Stethoscope className="h-3.5 w-3.5" />
        Book
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {/* AI thinking indicator */}
      <div className="flex items-center gap-2 text-sm text-sky-600">
        <Brain className="h-4 w-4 animate-pulse" />
        <span className="animate-pulse">Analyzing your symptoms…</span>
      </div>

      {/* Reasoning skeleton */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Doctor cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const recommend = useRecommendDoctor();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (symptoms.trim().length < 10) return;
    recommend.mutate({ symptoms: symptoms.trim() });
  }

  const charCount = symptoms.length;
  const isValid = charCount >= 10 && charCount <= 1000;

  return (
    <div className="space-y-6">
      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe what you're experiencing… e.g. I've had a persistent dry cough and chest tightness for the past three days, especially at night."
          className="min-h-[120px] resize-none text-sm leading-relaxed"
          maxLength={1000}
          aria-label="Describe your symptoms"
          disabled={recommend.isPending}
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-xs',
              charCount > 900 ? 'text-orange-500' : 'text-gray-400'
            )}
          >
            {charCount}/1000
          </span>
          <Button
            type="submit"
            disabled={!isValid || recommend.isPending}
            className="gap-2"
          >
            <SendHorizontal className="h-4 w-4" />
            {recommend.isPending ? 'Analyzing…' : 'Get AI Recommendation'}
          </Button>
        </div>
      </form>

      {/* Loading */}
      {recommend.isPending && <LoadingSkeleton />}

      {/* Error */}
      {recommend.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{recommend.error.message}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {recommend.isSuccess && (
        <div className="space-y-4">
          {/* AI Reasoning */}
          <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                  AI Recommendation
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {recommend.data.reasoning}
                </p>
                <Badge className="mt-1 bg-sky-100 text-sky-800 border-sky-200 text-xs">
                  {recommend.data.specialization}
                </Badge>
              </div>
            </div>
          </div>

          {/* Doctor List */}
          {recommend.data.doctors.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                {recommend.data.doctors.length} available doctor
                {recommend.data.doctors.length !== 1 ? 's' : ''} in{' '}
                {recommend.data.specialization}
              </p>
              {recommend.data.doctors.map((doctor) => (
                <DoctorResultCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-gray-700">
                No {recommend.data.specialization} doctors available right now
              </p>
              <p className="text-xs text-gray-500">
                Try browsing all doctors or contact support.
              </p>
              <Link
                href="/doctors"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'mt-2'
                )}
              >
                Browse all doctors
              </Link>
            </div>
          )}

          {/* Try again */}
          <button
            type="button"
            onClick={() => recommend.reset()}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Describe different symptoms
          </button>
        </div>
      )}
    </div>
  );
}
