'use client';

import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  slots: { startISO: string; endISO: string }[];
  selected: string | null;
  onSelect: (startISO: string, endISO: string) => void;
}

export function TimeSlotPicker({ slots, selected, onSelect }: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No available slots for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {slots.map((slot) => {
        const label = new Date(slot.startISO).toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const endLabel = new Date(slot.endISO).toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const isSelected = selected === slot.startISO;

        return (
          <button
            key={slot.startISO}
            type="button"
            onClick={() => onSelect(slot.startISO, slot.endISO)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background hover:bg-muted text-gray-700'
            )}
          >
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {label}
            </span>
            <span className={cn('text-xs', isSelected ? 'text-primary-foreground/70' : 'text-gray-400')}>
              – {endLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
