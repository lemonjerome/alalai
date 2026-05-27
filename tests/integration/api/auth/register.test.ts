/**
 * Integration tests for POST /api/auth/register
 *
 * These tests mock Mongoose models and bcryptjs to stay fast and not
 * require a real MongoDB connection. Rate limiting is skipped in test env.
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(null), // never rate-limit in tests
}));

const mockUserCreate = jest.fn();
const mockUserFindOne = jest.fn();
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: (...args: unknown[]) => mockUserFindOne(...args),
    create: (...args: unknown[]) => mockUserCreate(...args),
  },
}));

const mockPatientCreate = jest.fn();
jest.mock('@/models/PatientProfile', () => ({
  __esModule: true,
  default: { create: (...args: unknown[]) => mockPatientCreate(...args) },
}));

const mockDoctorCreate = jest.fn();
jest.mock('@/models/DoctorProfile', () => ({
  __esModule: true,
  default: { create: (...args: unknown[]) => mockDoctorCreate(...args) },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const patientPayload = {
  role: 'patient',
  email: 'patient@test.com',
  name: 'Test Patient',
  password: 'Password1',
  confirmPassword: 'Password1',
};

const doctorPayload = {
  role: 'doctor',
  email: 'doctor@test.com',
  name: 'Dr. Test',
  password: 'Password1',
  confirmPassword: 'Password1',
  licenseNumber: 'LIC-001',
  specialization: ['General Practice'],
  yearsOfExperience: 5,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    mockUserCreate.mockResolvedValue({
      _id: 'user123',
      email: 'test@test.com',
      name: 'Test',
      role: 'patient',
      toObject: () => ({
        _id: 'user123',
        email: 'test@test.com',
        name: 'Test',
        role: 'patient',
        passwordHash: 'hashed_password',
      }),
    });
    mockPatientCreate.mockResolvedValue({});
    mockDoctorCreate.mockResolvedValue({});
  });

  it('registers a patient and returns 201 without passwordHash', async () => {
    const res = await POST(makeRequest(patientPayload));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user.passwordHash).toBeUndefined();
    expect(mockPatientCreate).toHaveBeenCalledTimes(1);
    expect(mockDoctorCreate).not.toHaveBeenCalled();
  });

  it('registers a doctor and returns 201 with doctor profile', async () => {
    mockUserCreate.mockResolvedValue({
      _id: 'doc123',
      email: doctorPayload.email,
      name: doctorPayload.name,
      role: 'doctor',
      toObject: () => ({
        _id: 'doc123',
        email: doctorPayload.email,
        name: doctorPayload.name,
        role: 'doctor',
        passwordHash: 'hashed_password',
      }),
    });

    const res = await POST(makeRequest(doctorPayload));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.user.passwordHash).toBeUndefined();
    expect(mockDoctorCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        licenseNumber: 'LIC-001',
        specialization: ['General Practice'],
      })
    );
    expect(mockPatientCreate).not.toHaveBeenCalled();
  });

  it('returns 409 when email is already registered', async () => {
    mockUserFindOne.mockReturnValue({
      lean: () => Promise.resolve({ _id: 'existing', email: patientPayload.email }),
    });

    const res = await POST(makeRequest(patientPayload));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already registered/i);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when payload is invalid (missing required field)', async () => {
    const res = await POST(
      makeRequest({ role: 'patient', email: 'bad@test.com' }) // missing name/password
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Validation failed/i);
    expect(body.details).toBeDefined();
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await POST(
      makeRequest({ ...patientPayload, confirmPassword: 'WrongPassword1' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toBeDefined();
  });

  it('returns 400 when password is too weak', async () => {
    const res = await POST(
      makeRequest({ ...patientPayload, password: 'weak', confirmPassword: 'weak' })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details?.password).toBeDefined();
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Invalid JSON/i);
  });
});
