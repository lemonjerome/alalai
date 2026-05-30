'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlotPicker } from '@/components/appointments/TimeSlotPicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctorAvailability } from '@/hooks/useDoctorAvailability';
import { ArrowLeft } from 'lucide-react';

type SlotRange = { startISO: string; endISO: string };

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  /** DoctorProfile._id — NOT the user ID */
  doctorProfileId: string;
  durationMinutes?: number;
  isPending: boolean;
  onConfirm: (scheduledAt: string) => void;
}

function getMonthRange(date: Date): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function RescheduleDialog({
  open,
  onOpenChange,
  doctorProfileId,
  isPending,
  onConfirm,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date());

  const { from, to } = getMonthRange(month);
  const { data: availability, isLoading } = useDoctorAvailability(doctorProfileId, from, to);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const availableDays = new Set(
    Object.entries(availability ?? {})
      .filter(([, slots]) => slots.length > 0)
      .map(([date]) => date)
  );

  const selectedDateKey = selectedDate?.toISOString().slice(0, 10);
  const slotsForDay: SlotRange[] = selectedDateKey ? (availability?.[selectedDateKey] ?? []) : [];

  const handleDateSelect = (day: Date | undefined) => {
    setSelectedDate(day);
    setSelectedSlot(null);
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedSlot(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!selectedDate ? (
            <>
              <p className="text-sm text-gray-500">Select a new date for your appointment.</p>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={(day) => {
                    const key = day.toISOString().slice(0, 10);
                    return day < today || !availableDays.has(key);
                  }}
                  className="rounded-md border mx-auto"
                />
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {selectedDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Button>
              </div>
              <TimeSlotPicker
                slots={slotsForDay}
                selected={selectedSlot}
                onSelect={(startISO) => setSelectedSlot(startISO)}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedSlot && onConfirm(selectedSlot)}
            disabled={!selectedSlot || isPending}
          >
            {isPending ? 'Rescheduling…' : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
