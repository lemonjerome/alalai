export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  /** ISO string of startTime — convenient for display */
  startISO: string;
  endISO: string;
}

interface AvailabilityRecord {
  dayOfWeek: number;      // 0 = Sunday … 6 = Saturday
  startTime: string;      // 'HH:mm'
  endTime: string;        // 'HH:mm'
  slotDurationMinutes: number;
  isActive: boolean;
  blockedDates?: Date[];
}

interface AppointmentRecord {
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
}

/**
 * Parse 'HH:mm' string into { hours, minutes }.
 */
function parseHHmm(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Combine a date (provides year/month/day) with HH:mm time string
 * into a single UTC Date.
 */
function combineDateAndTime(date: Date, timeStr: string, tzOffsetMinutes = 0): Date {
  const { hours, minutes } = parseHHmm(timeStr);
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);
  // Adjust for timezone offset so times are treated as local (Philippine Time = UTC+8)
  return new Date(result.getTime() - tzOffsetMinutes * 60 * 1000);
}

/**
 * Check if a given date falls on a blocked date (same UTC year/month/day).
 */
function isBlocked(date: Date, blockedDates: Date[]): boolean {
  return blockedDates.some(
    (bd) =>
      bd.getUTCFullYear() === date.getUTCFullYear() &&
      bd.getUTCMonth() === date.getUTCMonth() &&
      bd.getUTCDate() === date.getUTCDate()
  );
}

/**
 * Return all available time slots for a doctor on a specific date.
 *
 * Algorithm:
 * 1. Filter availability records for the given day of week.
 * 2. Skip records with a matching blocked date.
 * 3. Expand each record into slots of `slotDurationMinutes`.
 * 4. Remove slots that overlap with existing confirmed/pending appointments.
 * 5. Remove slots that are in the past.
 */
export function getAvailableSlots(
  targetDate: Date,
  availabilities: AvailabilityRecord[],
  appointments: AppointmentRecord[],
  /** Local timezone offset in minutes (default 0 = UTC). PH = -480 for UTC+8) */
  tzOffsetMinutes = 0
): TimeSlot[] {
  const dayOfWeek = targetDate.getUTCDay();
  const now = new Date();

  const activeAvailabilities = availabilities.filter(
    (a) =>
      a.isActive &&
      a.dayOfWeek === dayOfWeek &&
      !isBlocked(targetDate, a.blockedDates ?? [])
  );

  const slots: TimeSlot[] = [];

  for (const avail of activeAvailabilities) {
    const slotStart = combineDateAndTime(targetDate, avail.startTime, tzOffsetMinutes);
    const slotEnd = combineDateAndTime(targetDate, avail.endTime, tzOffsetMinutes);

    let current = new Date(slotStart);

    while (current.getTime() + avail.slotDurationMinutes * 60_000 <= slotEnd.getTime()) {
      const end = new Date(current.getTime() + avail.slotDurationMinutes * 60_000);

      // Skip past slots
      if (end <= now) {
        current = end;
        continue;
      }

      // Skip slots that overlap with an existing appointment
      const overlaps = appointments.some((appt) => {
        if (!['pending', 'confirmed'].includes(appt.status)) return false;
        const apptEnd = new Date(
          appt.scheduledAt.getTime() + appt.durationMinutes * 60_000
        );
        return appt.scheduledAt < end && apptEnd > current;
      });

      if (!overlaps) {
        slots.push({
          startTime: new Date(current),
          endTime: new Date(end),
          startISO: current.toISOString(),
          endISO: end.toISOString(),
        });
      }

      current = end;
    }
  }

  // Sort chronologically
  slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return slots;
}
