'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useDoctorAvailability } from '@/hooks/useDoctorAvailability';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CalendarDays } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* Calendar — fixed width so it never stretches */}
      <div className="shrink-0">
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
          className="rounded-md border w-fit"
        />
      </div>

      {/* Time slots panel — fills remaining width */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9" />)}
            </div>
          </div>
        ) : !selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center text-gray-400 gap-2">
            <CalendarDays className="h-8 w-8 opacity-30" />
            <p className="text-sm">Select a highlighted date<br />to see available times</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {selectedDate.toLocaleDateString('en-PH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            {slotsForDay.length === 0 ? (
              <p className="text-sm text-gray-400">No available slots on this day.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
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
                      <Clock className="h-3 w-3 shrink-0" />
                      {label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
