'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlotPicker } from '@/components/appointments/TimeSlotPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorAvailability } from '@/hooks/useDoctorAvailability';
import { useBookAppointment } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import { CheckCircle2, ArrowLeft, ArrowRight, Clock, Calendar as CalIcon } from 'lucide-react';

interface BookingWizardProps {
  doctorId: string;
  doctorName: string;
  durationMinutes: number;
  /** Pre-selected ISO slot from URL param (?slot=...) */
  initialSlot?: string;
}

type Step = 'date' | 'slot' | 'confirm' | 'success';

function getMonthRange(date: Date): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function BookingWizard({
  doctorId,
  doctorName,
  durationMinutes,
  initialSlot,
}: BookingWizardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(initialSlot ? 'confirm' : 'date');

  // Scroll the card into view whenever the step changes so the header is never clipped
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialSlot ? new Date(initialSlot) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialSlot ?? null);
  const [month, setMonth] = useState(selectedDate ?? new Date());

  const { from, to } = getMonthRange(month);
  const { data: availability, isLoading: loadingAvail } = useDoctorAvailability(doctorId, from, to);
  const bookMutation = useBookAppointment();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const availableDays = new Set(
    Object.entries(availability ?? {})
      .filter(([, slots]) => slots.length > 0)
      .map(([date]) => date)
  );

  const selectedDateKey = selectedDate?.toISOString().slice(0, 10);
  const slotsForDay = selectedDateKey ? (availability?.[selectedDateKey] ?? []) : [];

  const handleDateSelect = (day: Date | undefined) => {
    setSelectedDate(day);
    setSelectedSlot(null);
    if (day) setStep('slot');
  };

  const handleSlotSelect = (startISO: string) => {
    setSelectedSlot(startISO);
    setStep('confirm');
  };

  const handleBook = () => {
    if (!selectedSlot) return;
    bookMutation.mutate(
      { doctorId, scheduledAt: selectedSlot, durationMinutes },
      {
        onSuccess: () => setStep('success'),
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const STEPS: Step[] = ['date', 'slot', 'confirm'];
  const stepLabels: Record<string, string> = { date: 'Choose Date', slot: 'Pick Time', confirm: 'Confirm', success: 'Done' };

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your consultation with Dr. {doctorName} is scheduled for{' '}
            <strong>
              {new Date(selectedSlot!).toLocaleDateString('en-PH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}{' '}
              at{' '}
              {new Date(selectedSlot!).toLocaleTimeString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
            .
          </p>
          <p className="text-sm text-gray-500">
            You&apos;ll receive a confirmation notification. A reminder will be sent 24 hours before
            your appointment.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push('/appointments')}>
              View My Appointments
            </Button>
            <Button onClick={() => router.push('/doctors')}>Browse More Doctors</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={cardRef}>
      <CardHeader>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold
                  ${step === s ? 'bg-primary text-primary-foreground' : STEPS.indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {stepLabels[s]}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-4 bg-gray-200" />}
            </div>
          ))}
        </div>
        <CardTitle className="text-base">Book with Dr. {doctorName}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 1: Date */}
        {step === 'date' && (
          <>
            <p className="text-sm text-gray-600">Select a date to see available time slots.</p>
            {loadingAvail ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={(day) =>
                  day < today || !availableDays.has(day.toISOString().slice(0, 10))
                }
                modifiers={{ available: (d) => availableDays.has(d.toISOString().slice(0, 10)) }}
                modifiersClassNames={{ available: 'bg-primary/10 text-primary font-semibold rounded-md' }}
                className="rounded-md border"
              />
            )}
          </>
        )}

        {/* Step 2: Slot */}
        {step === 'slot' && selectedDate && (
          <>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
              onClick={() => setStep('date')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change date
            </button>
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <CalIcon className="h-4 w-4 text-primary" />
              {selectedDate.toLocaleDateString('en-PH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {loadingAvail ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <TimeSlotPicker
                slots={slotsForDay}
                selected={selectedSlot}
                onSelect={(startISO) => handleSlotSelect(startISO)}
              />
            )}
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedDate && selectedSlot && (
          <>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
              onClick={() => setStep('slot')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change time
            </button>

            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">Appointment Summary</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="text-gray-500">Doctor:</span> Dr. {doctorName}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(selectedSlot).toLocaleDateString('en-PH', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(selectedSlot).toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p>
                  <span className="text-gray-500">Duration:</span> {durationMinutes} minutes
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleBook}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? 'Booking…' : 'Confirm Booking'}
              {!bookMutation.isPending && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
