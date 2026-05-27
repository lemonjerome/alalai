import {
  loginSchema,
  registerPatientSchema,
  registerDoctorSchema,
} from '@/lib/validations/auth';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('lowercases email', () => {
    const result = loginSchema.safeParse({ email: 'TEST@EXAMPLE.COM', password: 'secret' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('test@example.com');
  });
});

describe('registerPatientSchema', () => {
  const validPatient = {
    role: 'patient' as const,
    email: 'patient@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    name: 'Juan dela Cruz',
  };

  it('accepts valid patient registration', () => {
    const result = registerPatientSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
  });

  it('rejects weak password (no uppercase)', () => {
    const result = registerPatientSchema.safeParse({
      ...validPatient,
      password: 'password1',
      confirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no number)', () => {
    const result = registerPatientSchema.safeParse({
      ...validPatient,
      password: 'Password',
      confirmPassword: 'Password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registerPatientSchema.safeParse({
      ...validPatient,
      confirmPassword: 'DifferentPassword1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('confirmPassword');
    }
  });

  it('rejects name shorter than 2 characters', () => {
    const result = registerPatientSchema.safeParse({ ...validPatient, name: 'J' });
    expect(result.success).toBe(false);
  });
});

describe('registerDoctorSchema', () => {
  const validDoctor = {
    role: 'doctor' as const,
    email: 'doctor@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    name: 'Dr. Maria Santos',
    licenseNumber: 'PRC-12345',
    specialization: ['Cardiology'],
    yearsOfExperience: 5,
  };

  it('accepts valid doctor registration', () => {
    const result = registerDoctorSchema.safeParse(validDoctor);
    expect(result.success).toBe(true);
  });

  it('rejects missing license number', () => {
    const result = registerDoctorSchema.safeParse({
      ...validDoctor,
      licenseNumber: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty specialization array', () => {
    const result = registerDoctorSchema.safeParse({
      ...validDoctor,
      specialization: [],
    });
    expect(result.success).toBe(false);
  });
});
