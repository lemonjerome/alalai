import {
  updateDoctorProfileSchema,
  availabilitySlotSchema,
  updateAvailabilitySlotSchema,
} from '@/lib/validations/doctor';

describe('updateDoctorProfileSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    const result = updateDoctorProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a full valid update', () => {
    const result = updateDoctorProfileSchema.safeParse({
      name: 'Dr. Maria Santos',
      phone: '+63912345678',
      licenseNumber: 'MD-12345',
      specialization: ['Cardiology', 'Internal Medicine'],
      bio: 'Board-certified cardiologist with 10 years of experience.',
      education: ['University of the Philippines College of Medicine'],
      yearsOfExperience: 10,
      consultationFee: 800,
      isAcceptingPatients: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = updateDoctorProfileSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects empty specialization array', () => {
    const result = updateDoctorProfileSchema.safeParse({ specialization: [] });
    expect(result.success).toBe(false);
  });

  it('rejects negative yearsOfExperience', () => {
    const result = updateDoctorProfileSchema.safeParse({ yearsOfExperience: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative consultationFee', () => {
    const result = updateDoctorProfileSchema.safeParse({ consultationFee: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts zero consultationFee', () => {
    const result = updateDoctorProfileSchema.safeParse({ consultationFee: 0 });
    expect(result.success).toBe(true);
  });

  it('accepts zero yearsOfExperience (new doctor)', () => {
    const result = updateDoctorProfileSchema.safeParse({ yearsOfExperience: 0 });
    expect(result.success).toBe(true);
  });
});

describe('availabilitySlotSchema', () => {
  const valid = {
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    isActive: true,
    blockedDates: [],
  };

  it('accepts a valid slot', () => {
    const result = availabilitySlotSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('defaults slotDurationMinutes to 30 when omitted', () => {
    const { slotDurationMinutes: _, ...without } = valid;
    const result = availabilitySlotSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slotDurationMinutes).toBe(30);
    }
  });

  it('defaults isActive to true when omitted', () => {
    const { isActive: _, ...without } = valid;
    const result = availabilitySlotSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects dayOfWeek below 0', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, dayOfWeek: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects dayOfWeek above 6', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, dayOfWeek: 7 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid startTime format', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, startTime: '9:00' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid endTime format', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, endTime: '25:00' });
    expect(result.success).toBe(false);
  });

  it('accepts all 7 days of week', () => {
    for (let day = 0; day <= 6; day++) {
      const result = availabilitySlotSchema.safeParse({ ...valid, dayOfWeek: day });
      expect(result.success).toBe(true);
    }
  });

  it('rejects slotDurationMinutes below 15', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, slotDurationMinutes: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects slotDurationMinutes above 120', () => {
    const result = availabilitySlotSchema.safeParse({ ...valid, slotDurationMinutes: 121 });
    expect(result.success).toBe(false);
  });
});

describe('updateAvailabilitySlotSchema', () => {
  it('accepts an empty update', () => {
    const result = updateAvailabilitySlotSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only isActive', () => {
    const result = updateAvailabilitySlotSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
