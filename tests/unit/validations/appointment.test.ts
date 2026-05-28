import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from '@/lib/validations/appointment';

describe('createAppointmentSchema', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const validDoctorId = '507f1f77bcf86cd799439011';

  it('accepts a valid booking request', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: futureDate,
      durationMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it('defaults durationMinutes to 30 when omitted', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: futureDate,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMinutes).toBe(30);
    }
  });

  it('rejects missing doctorId', () => {
    const result = createAppointmentSchema.safeParse({
      scheduledAt: futureDate,
      durationMinutes: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty doctorId', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: '',
      scheduledAt: futureDate,
      durationMinutes: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date string', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: 'not-a-date',
      durationMinutes: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration below minimum (15)', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: futureDate,
      durationMinutes: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects duration above maximum (120)', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: futureDate,
      durationMinutes: 121,
    });
    expect(result.success).toBe(false);
  });

  it('accepts maximum allowed duration (120)', () => {
    const result = createAppointmentSchema.safeParse({
      doctorId: validDoctorId,
      scheduledAt: futureDate,
      durationMinutes: 120,
    });
    expect(result.success).toBe(true);
  });
});

describe('rescheduleAppointmentSchema', () => {
  it('accepts a valid ISO datetime', () => {
    const result = rescheduleAppointmentSchema.safeParse({
      scheduledAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-datetime string', () => {
    const result = rescheduleAppointmentSchema.safeParse({ scheduledAt: '2026-06' });
    expect(result.success).toBe(false);
  });
});

describe('cancelAppointmentSchema', () => {
  it('accepts a valid cancellation reason', () => {
    const result = cancelAppointmentSchema.safeParse({
      cancellationReason: 'Cannot make it due to work conflict',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reason', () => {
    const result = cancelAppointmentSchema.safeParse({ cancellationReason: '' });
    expect(result.success).toBe(false);
  });

  it('rejects reason shorter than 5 characters', () => {
    const result = cancelAppointmentSchema.safeParse({ cancellationReason: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects missing reason', () => {
    const result = cancelAppointmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
