'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useDoctorAvailability } from '@/hooks/useDoctorAvailability';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

interface AvailabilityCalendarProps {
  doctorId: string;
  /** Called when the patient selects a specific time slot */
  onSelectSlot?: (startISO: string, endISO: string) => void;
}

function getMonthRange(date: Date): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function AvailabilityCalendar({ doctorId, onSelectSlot }: AvailabilityCalendarProps) {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { from, to } = getMonthRange(month);
  const { data: availability, isLoading } = useDoctorAvailability(doctorId, from, to);

  // Days that have at least one slot
  const availableDays = useMemo(() => {
    if (!availability) return new Set<string>();
    return new Set(
      Object.entries(availability)
        .filter(([, slots]) => slots.length > 0)
        .map(([date]) => date)
    );
  }, [availability]);

  const selectedDateKey = selectedDate?.toISOString().slice(0, 10);
  const slotsForDay = selectedDateKey ? (availability?.[selectedDateKey] ?? []) : [];

  const modifiers = {
    available: (day: Date) => availableDays.has(day.toISOString().slice(0, 10)),
  };

  const modifiersClassNames = {
    available: 'bg-primary/10 text-primary font-semibold rounded-md',
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(day) => {
          setSelectedDate(day);
          setSelectedSlot(null);
        }}
        month={month}
        onMonthChange={setMonth}
        disabled={(day) => day < today || !availableDays.has(day.toISOString().slice(0, 10))}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-md border"
      />

      {isLoading && <Skeleton className="h-20 w-full" />}

      {selectedDate && !isLoading && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Available slots on{' '}
            {selectedDate.toLocaleDateString('en-PH', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            :
          </p>

          {slotsForDay.length === 0 ? (
            <p className="text-sm text-gray-400">No available slots on this day.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slotsForDay.map((slot) => {
                const label = new Date(slot.startISO).toLocaleTimeString('en-PH', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isSelected = selectedSlot === slot.startISO;
                return (
                  <Button
                    key={slot.startISO}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedSlot(slot.startISO);
                      onSelectSlot?.(slot.startISO, slot.endISO);
                    }}
                  >
                    <Clock className="h-3 w-3" />
                    {label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
