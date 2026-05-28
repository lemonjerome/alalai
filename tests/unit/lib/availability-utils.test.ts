import { getAvailableSlots } from '@/lib/availability-utils';

// Helper to build a Date for a specific UTC day + time
function utcDate(
  year: number,
  month: number, // 1-based
  day: number,
  hour = 0,
  minute = 0
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

// Use next Wednesday relative to today so slots are never in the past
function nextWeekday(dayOfWeek: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const diff = ((dayOfWeek - d.getUTCDay() + 7) % 7) || 7; // at least 1 day ahead
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

const TARGET_DATE = nextWeekday(3); // next Wednesday

const BASE_AVAIL = {
  dayOfWeek: 3, // Wednesday
  startTime: '09:00',
  endTime: '12:00',
  slotDurationMinutes: 60,
  isActive: true,
  blockedDates: [] as Date[],
};

describe('getAvailableSlots', () => {
  describe('basic slot generation', () => {
    it('returns slots for the matching day', () => {
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], []);
      // 09:00–10:00, 10:00–11:00, 11:00–12:00 = 3 slots
      expect(slots).toHaveLength(3);
    });

    it('returns empty array when no availability on that day', () => {
      const avail = { ...BASE_AVAIL, dayOfWeek: 1 }; // Monday, not Wednesday
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(0);
    });

    it('returns empty array when availability is inactive', () => {
      const avail = { ...BASE_AVAIL, isActive: false };
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(0);
    });

    it('generates correct slot times', () => {
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], []);
      const y = TARGET_DATE.getUTCFullYear();
      const mo = TARGET_DATE.getUTCMonth() + 1;
      const d = TARGET_DATE.getUTCDate();
      expect(slots[0].startISO).toBe(utcDate(y, mo, d, 9, 0).toISOString());
      expect(slots[0].endISO).toBe(utcDate(y, mo, d, 10, 0).toISOString());
      expect(slots[1].startISO).toBe(utcDate(y, mo, d, 10, 0).toISOString());
      expect(slots[2].startISO).toBe(utcDate(y, mo, d, 11, 0).toISOString());
    });

    it('returns slots sorted chronologically', () => {
      // Two availabilities on the same day
      const avail2 = { ...BASE_AVAIL, startTime: '14:00', endTime: '16:00' };
      const slots = getAvailableSlots(TARGET_DATE, [avail2, BASE_AVAIL], []);
      for (let i = 1; i < slots.length; i++) {
        expect(slots[i].startTime.getTime()).toBeGreaterThan(
          slots[i - 1].startTime.getTime()
        );
      }
    });

    it('handles 30-minute slots correctly', () => {
      const avail = { ...BASE_AVAIL, startTime: '09:00', endTime: '10:00', slotDurationMinutes: 30 };
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(2); // 09:00–09:30, 09:30–10:00
    });
  });

  describe('blocked dates', () => {
    it('returns empty when the date is blocked', () => {
      const avail = { ...BASE_AVAIL, blockedDates: [TARGET_DATE] };
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(0);
    });

    it('still generates slots when a different date is blocked', () => {
      const differentDate = utcDate(2026, 1, 14); // next Wednesday
      const avail = { ...BASE_AVAIL, blockedDates: [differentDate] };
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(3);
    });
  });

  describe('appointment conflicts', () => {
    it('removes slot booked by a confirmed appointment', () => {
      const y = TARGET_DATE.getUTCFullYear(), mo = TARGET_DATE.getUTCMonth() + 1, d = TARGET_DATE.getUTCDate();
      const appt = { scheduledAt: utcDate(y, mo, d, 9, 0), durationMinutes: 60, status: 'confirmed' };
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], [appt]);
      expect(slots).toHaveLength(2);
      expect(slots[0].startISO).toBe(utcDate(y, mo, d, 10, 0).toISOString());
    });

    it('removes slot booked by a pending appointment', () => {
      const y = TARGET_DATE.getUTCFullYear(), mo = TARGET_DATE.getUTCMonth() + 1, d = TARGET_DATE.getUTCDate();
      const appt = { scheduledAt: utcDate(y, mo, d, 10, 0), durationMinutes: 60, status: 'pending' };
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], [appt]);
      expect(slots).toHaveLength(2);
    });

    it('does NOT remove slot for cancelled appointments', () => {
      const y = TARGET_DATE.getUTCFullYear(), mo = TARGET_DATE.getUTCMonth() + 1, d = TARGET_DATE.getUTCDate();
      const appt = { scheduledAt: utcDate(y, mo, d, 9, 0), durationMinutes: 60, status: 'cancelled' };
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], [appt]);
      expect(slots).toHaveLength(3);
    });

    it('does NOT remove slot for completed appointments', () => {
      const y = TARGET_DATE.getUTCFullYear(), mo = TARGET_DATE.getUTCMonth() + 1, d = TARGET_DATE.getUTCDate();
      const appt = { scheduledAt: utcDate(y, mo, d, 9, 0), durationMinutes: 60, status: 'completed' };
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], [appt]);
      expect(slots).toHaveLength(3);
    });

    it('removes all slots when all are booked', () => {
      const y = TARGET_DATE.getUTCFullYear(), mo = TARGET_DATE.getUTCMonth() + 1, d = TARGET_DATE.getUTCDate();
      const appts = [
        { scheduledAt: utcDate(y, mo, d, 9, 0), durationMinutes: 60, status: 'confirmed' },
        { scheduledAt: utcDate(y, mo, d, 10, 0), durationMinutes: 60, status: 'confirmed' },
        { scheduledAt: utcDate(y, mo, d, 11, 0), durationMinutes: 60, status: 'pending' },
      ];
      const slots = getAvailableSlots(TARGET_DATE, [BASE_AVAIL], appts);
      expect(slots).toHaveLength(0);
    });
  });

  describe('past slot filtering', () => {
    it('excludes slots that have already ended', () => {
      // Use a past date — all slots will be filtered out
      const pastDate = utcDate(2020, 1, 1);
      const slots = getAvailableSlots(pastDate, [{ ...BASE_AVAIL, dayOfWeek: pastDate.getUTCDay() }], []);
      expect(slots).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when no availabilities provided', () => {
      const slots = getAvailableSlots(TARGET_DATE, [], []);
      expect(slots).toHaveLength(0);
    });

    it('returns empty array when slot duration does not fit in window', () => {
      // 30-min window but 60-min slots
      const avail = { ...BASE_AVAIL, startTime: '09:00', endTime: '09:30', slotDurationMinutes: 60 };
      const slots = getAvailableSlots(TARGET_DATE, [avail], []);
      expect(slots).toHaveLength(0);
    });

    it('handles multiple availabilities on the same day', () => {
      const morning = { ...BASE_AVAIL, startTime: '09:00', endTime: '10:00' };
      const afternoon = { ...BASE_AVAIL, startTime: '14:00', endTime: '16:00' };
      const slots = getAvailableSlots(TARGET_DATE, [morning, afternoon], []);
      expect(slots).toHaveLength(3); // 1 morning + 2 afternoon
    });
  });
});
