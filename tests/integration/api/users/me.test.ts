import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/users/me/route';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: 'user123', email: 'test@test.com', name: 'Test', role: 'patient' },
  }),
}));

const mockFindById = jest.fn();
const mockFindOne = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

jest.mock('@/models/PatientProfile', () => ({
  __esModule: true,
  default: { findOne: (...args: unknown[]) => mockFindOne(...args) },
}));

jest.mock('@/models/DoctorProfile', () => ({
  __esModule: true,
  default: { findOne: (...args: unknown[]) => mockFindOne(...args) },
}));

const baseUser = {
  _id: 'user123',
  email: 'test@test.com',
  name: 'Test User',
  role: 'patient',
  phone: '',
  passwordHash: 'hashed',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindById.mockReturnValue({ lean: () => Promise.resolve(baseUser) });
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve({ userId: 'user123' }) });
  });

  it('returns user without passwordHash', async () => {
    const req = new NextRequest('http://localhost/api/users/me');
    const res = await GET(req, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toBeDefined();
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.user.email).toBe('test@test.com');
  });

  it('returns 404 when user not found', async () => {
    mockFindById.mockReturnValue({ lean: () => Promise.resolve(null) });
    const req = new NextRequest('http://localhost/api/users/me');
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindByIdAndUpdate.mockReturnValue({
      lean: () => Promise.resolve({ ...baseUser, name: 'Updated Name' }),
    });
  });

  it('updates name and returns sanitized user', async () => {
    const req = new NextRequest('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({}) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.name).toBe('Updated Name');
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }), // too short
    });
    const res = await PATCH(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const { auth } = require('@/lib/auth');
    auth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
  });
});
