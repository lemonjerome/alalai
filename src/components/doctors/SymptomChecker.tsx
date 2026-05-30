'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendDoctor } from '@/hooks/useRecommendDoctor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Brain,
  AlertCircle,
  Star,
  PhilippinePeso,
  CheckCircle2,
  Stethoscope,
  SendHorizontal,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { RecommendedDoctor } from '@/lib/validations/recommend';

type ViewMode = 'topRated' | 'mostAvailable';

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
            <span className="font-medium text-gray-700">{(doctor.rating ?? 0).toFixed(1)}</span>
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

      <a
        href={`/doctors/${doctor.doctorProfileId}`}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'shrink-0 gap-1.5 self-start sm:self-center',
        )}
      >
        <Stethoscope className="h-3.5 w-3.5" />
        Book
      </a>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2 text-sm text-sky-600">
        <Brain className="h-4 w-4 animate-pulse" />
        <span className="animate-pulse">Analyzing your symptoms…</span>
      </div>
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
      </div>
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

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
      <button
        type="button"
        onClick={() => onChange('topRated')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          mode === 'topRated'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        <TrendingUp className="h-3.5 w-3.5" />
        Top Rated
      </button>
      <button
        type="button"
        onClick={() => onChange('mostAvailable')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          mode === 'mostAvailable'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        <Calendar className="h-3.5 w-3.5" />
        Most Available
      </button>
    </div>
  );
}

export function SymptomChecker() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('topRated');
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const recommend = useRecommendDoctor();

  const hasResults = recommend.isSuccess;

  // ── Browser unload guard (refresh / close tab / external links) ──────────
  useEffect(() => {
    if (!hasResults) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasResults]);

  // ── Client-side navigation guard (intercepts all <a> clicks) ─────────────
  useEffect(() => {
    if (!hasResults) return;

    const handler = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      // Ignore anchors, mail links, or links inside the leave-warning dialog itself
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        anchor.closest('[data-nav-guard-exempt]')
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setShowLeaveWarning(true);
    };

    // Capture phase so we intercept before Next.js router does
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [hasResults]);

  function handleLeaveConfirm() {
    const href = pendingHref;
    setShowLeaveWarning(false);
    setPendingHref(null);
    recommend.reset();
    if (href) router.push(href);
  }

  function handleLeaveCancel() {
    setShowLeaveWarning(false);
    setPendingHref(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (symptoms.trim().length < 10) return;
    recommend.mutate({ symptoms: symptoms.trim() });
  }

  const charCount = symptoms.length;
  const isValid = charCount >= 10 && charCount <= 1000;

  const totalDoctors = recommend.data
    ? Object.values(recommend.data.bySpecialization).reduce(
        (sum, g) =>
          sum + (viewMode === 'topRated' ? g.topRated.length : g.mostAvailable.length),
        0,
      )
    : 0;

  return (
    <>
      {/* ── Leave-warning dialog ─────────────────────────────────────────── */}
      <Dialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <DialogTitle>Switch pages?</DialogTitle>
            </div>
            <DialogDescription>
              Your current AI recommendation results will be removed. You&apos;ll need to
              re-enter your symptoms if you want new results later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter data-nav-guard-exempt="">
            <Button variant="outline" onClick={handleLeaveCancel}>
              Stay here
            </Button>
            <Button variant="destructive" onClick={handleLeaveConfirm}>
              Switch &amp; clear results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* ── Input ──────────────────────────────────────────────────────── */}
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
              className={cn('text-xs', charCount > 900 ? 'text-orange-500' : 'text-gray-400')}
            >
              {charCount}/1000
            </span>
            <Button type="submit" disabled={!isValid || recommend.isPending} className="gap-2">
              <SendHorizontal className="h-4 w-4" />
              {recommend.isPending ? 'Analyzing…' : 'Get AI Recommendation'}
            </Button>
          </div>
        </form>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {recommend.isPending && <LoadingSkeleton />}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {recommend.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{recommend.error.message}</AlertDescription>
          </Alert>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {recommend.isSuccess && (
          <div className="space-y-5">
            {/* AI Reasoning */}
            <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                    AI Recommendation
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {recommend.data.reasoning}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {recommend.data.specializations.map((s) => (
                      <Badge
                        key={s}
                        className="bg-sky-100 text-sky-800 border-sky-200 text-xs"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {totalDoctors > 0
                  ? `${totalDoctors} doctor${totalDoctors !== 1 ? 's' : ''} found`
                  : 'Matching doctors'}
              </p>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {/* Doctor groups by specialization */}
            {totalDoctors > 0 ? (
              <div className="space-y-6">
                {recommend.data.specializations.map((spec) => {
                  const group = recommend.data.bySpecialization[spec];
                  if (!group) return null;
                  const doctors =
                    viewMode === 'topRated' ? group.topRated : group.mostAvailable;
                  if (doctors.length === 0) return null;

                  return (
                    <div key={spec} className="space-y-3">
                      {recommend.data.specializations.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {spec}
                          </Badge>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      )}
                      {doctors.map((doctor) => (
                        <DoctorResultCard key={doctor._id} doctor={doctor} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  No doctors available for the recommended{' '}
                  {recommend.data.specializations.length === 1
                    ? 'specialization'
                    : 'specializations'}{' '}
                  right now
                </p>
                <p className="text-xs text-gray-500">
                  Try browsing all doctors or contact support.
                </p>
                <Link
                  href="/doctors"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2')}
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
    </>
  );
}
