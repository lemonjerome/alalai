import { createMedicalRecordSchema, prescriptionSchema, updateMedicalRecordSchema } from '@/lib/validations/medicalRecord';

describe('prescriptionSchema', () => {
  const valid = {
    medication: 'Amoxicillin',
    dosage: '500mg',
    frequency: '3x daily',
    duration: '7 days',
    instructions: 'Take with food',
  };

  it('accepts a full valid prescription', () => {
    const result = prescriptionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('defaults instructions to empty string when omitted', () => {
    const { instructions: _, ...without } = valid;
    const result = prescriptionSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instructions).toBe('');
    }
  });

  it('rejects empty medication', () => {
    const result = prescriptionSchema.safeParse({ ...valid, medication: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty dosage', () => {
    const result = prescriptionSchema.safeParse({ ...valid, dosage: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty frequency', () => {
    const result = prescriptionSchema.safeParse({ ...valid, frequency: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty duration', () => {
    const result = prescriptionSchema.safeParse({ ...valid, duration: '' });
    expect(result.success).toBe(false);
  });
});

describe('createMedicalRecordSchema', () => {
  it('accepts a full valid record', () => {
    const result = createMedicalRecordSchema.safeParse({
      consultationNotes: 'Patient presents with cough',
      diagnosis: 'URTI',
      prescriptions: [
        { medication: 'Amox', dosage: '500mg', frequency: '3x', duration: '7d' },
      ],
      followUpDate: '2026-06-01T00:00:00.000Z',
      attachments: [],
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults when fields are omitted', () => {
    const result = createMedicalRecordSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.consultationNotes).toBe('');
      expect(result.data.diagnosis).toBe('');
      expect(result.data.prescriptions).toEqual([]);
      expect(result.data.followUpDate).toBeNull();
      expect(result.data.attachments).toEqual([]);
    }
  });

  it('accepts empty prescriptions array', () => {
    const result = createMedicalRecordSchema.safeParse({ prescriptions: [] });
    expect(result.success).toBe(true);
  });

  it('rejects invalid followUpDate format', () => {
    const result = createMedicalRecordSchema.safeParse({
      followUpDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null followUpDate', () => {
    const result = createMedicalRecordSchema.safeParse({ followUpDate: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followUpDate).toBeNull();
    }
  });

  it('rejects attachments that are not URLs', () => {
    const result = createMedicalRecordSchema.safeParse({
      attachments: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid Cloudinary URLs in attachments', () => {
    const result = createMedicalRecordSchema.safeParse({
      attachments: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
    });
    expect(result.success).toBe(true);
  });
});

describe('updateMedicalRecordSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    const result = updateMedicalRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only diagnosis', () => {
    const result = updateMedicalRecordSchema.safeParse({ diagnosis: 'Hypertension' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosis).toBe('Hypertension');
    }
  });

  it('accepts partial update with only prescriptions', () => {
    const result = updateMedicalRecordSchema.safeParse({
      prescriptions: [
        { medication: 'Lisinopril', dosage: '10mg', frequency: '1x daily', duration: '30 days' },
      ],
    });
    expect(result.success).toBe(true);
  });
});
