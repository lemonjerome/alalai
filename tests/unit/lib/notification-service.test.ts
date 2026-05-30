/**
 * Unit tests for NotificationService.
 * Mocks: @/lib/db, @/models/Notification, @/lib/pusher
 */

// --- Module mocks (must be before imports) ---
jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockNotificationCreate = jest.fn();
jest.mock('@/models/Notification', () => ({
  __esModule: true,
  default: {
    create: mockNotificationCreate,
  },
}));

// Pusher is dynamically imported; mock the module
const mockTrigger = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/pusher', () => ({
  getPusherServer: () => ({ trigger: mockTrigger }),
}));

import { NotificationService } from '@/lib/notification-service';

// --- Helpers ---
function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'notif-id-123',
    type: 'appointment_request',
    title: 'Test',
    message: 'Test message',
    link: '',
    data: {},
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNotificationCreate.mockResolvedValue(makeNotification());
});

// ─────────────────────────────────────────────────────────────────────────────
// sendBookingRequest (replaces the old sendAppointmentBooked)
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendBookingRequest', () => {
  const params = {
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    doctorName: 'Smith',
    patientName: 'Jane Doe',
    appointmentId: 'appt-1',
    scheduledAt: new Date('2026-06-01T09:00:00Z'),
  };

  it('creates two notifications — one for patient, one for doctor', async () => {
    await NotificationService.sendBookingRequest(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });

  it('patient notification has correct userId and type', async () => {
    await NotificationService.sendBookingRequest(params);
    const patientCall = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(patientCall.userId).toBe('patient-1');
    expect(patientCall.type).toBe('appointment_request');
  });

  it('doctor notification has correct userId', async () => {
    await NotificationService.sendBookingRequest(params);
    const doctorCall = mockNotificationCreate.mock.calls[1][0] as Record<string, unknown>;
    expect(doctorCall.userId).toBe('doctor-1');
  });

  it('includes appointmentId in data', async () => {
    await NotificationService.sendBookingRequest(params);
    const patientCall = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect((patientCall.data as Record<string, unknown>).appointmentId).toBe('appt-1');
  });

  it('triggers Pusher events for both users', async () => {
    await NotificationService.sendBookingRequest(params);
    expect(mockTrigger).toHaveBeenCalledTimes(2);
    expect(mockTrigger).toHaveBeenCalledWith(
      'private-user-patient-1',
      'notification',
      expect.any(Object)
    );
    expect(mockTrigger).toHaveBeenCalledWith(
      'private-user-doctor-1',
      'notification',
      expect.any(Object)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendAppointmentConfirmed
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendAppointmentConfirmed', () => {
  const params = {
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    doctorName: 'Smith',
    patientName: 'Jane Doe',
    appointmentId: 'appt-1',
    scheduledAt: new Date('2026-06-01T09:00:00Z'),
  };

  it('creates two notifications — one for patient, one for doctor', async () => {
    await NotificationService.sendAppointmentConfirmed(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });

  it('both notifications have appointment_confirmed type', async () => {
    mockNotificationCreate.mockResolvedValue(makeNotification({ type: 'appointment_confirmed' }));
    await NotificationService.sendAppointmentConfirmed(params);
    for (const call of mockNotificationCreate.mock.calls) {
      expect((call[0] as Record<string, unknown>).type).toBe('appointment_confirmed');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendAppointmentRejected
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendAppointmentRejected', () => {
  const params = {
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    doctorName: 'Smith',
    patientName: 'Jane Doe',
    appointmentId: 'appt-1',
    scheduledAt: new Date('2026-06-01T09:00:00Z'),
    reason: 'Schedule conflict',
  };

  it('creates two notifications', async () => {
    await NotificationService.sendAppointmentRejected(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });

  it('patient notification includes reason in message', async () => {
    await NotificationService.sendAppointmentRejected(params);
    const patientCall = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(patientCall.message as string).toContain('Schedule conflict');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendRecordAvailable
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendRecordAvailable', () => {
  const params = {
    patientId: 'patient-2',
    doctorName: 'Reyes',
    appointmentId: 'appt-2',
  };

  it('creates exactly one notification', async () => {
    await NotificationService.sendRecordAvailable(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
  });

  it('sends to patient with record_available type', async () => {
    mockNotificationCreate.mockResolvedValue(makeNotification({ type: 'record_available' }));
    await NotificationService.sendRecordAvailable(params);
    const call = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.userId).toBe('patient-2');
    expect(call.type).toBe('record_available');
  });

  it('includes doctor name in message', async () => {
    await NotificationService.sendRecordAvailable(params);
    const call = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.message as string).toContain('Dr. Reyes');
  });

  it('triggers one Pusher event', async () => {
    await NotificationService.sendRecordAvailable(params);
    expect(mockTrigger).toHaveBeenCalledTimes(1);
    expect(mockTrigger).toHaveBeenCalledWith(
      'private-user-patient-2',
      'notification',
      expect.any(Object)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendAppointmentCancelled
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendAppointmentCancelled', () => {
  const params = {
    patientId: 'patient-3',
    doctorId: 'doctor-3',
    doctorName: 'Santos',
    patientName: 'Maria Cruz',
    appointmentId: 'appt-3',
    scheduledAt: new Date('2026-06-02T10:00:00Z'),
    cancelledBy: 'patient' as const,
    reason: 'Work conflict',
  };

  it('creates two notifications', async () => {
    await NotificationService.sendAppointmentCancelled(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
  });

  it('both notifications have appointment_cancelled type', async () => {
    mockNotificationCreate.mockResolvedValue(makeNotification({ type: 'appointment_cancelled' }));
    await NotificationService.sendAppointmentCancelled(params);
    for (const call of mockNotificationCreate.mock.calls) {
      expect((call[0] as Record<string, unknown>).type).toBe('appointment_cancelled');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sendAppointmentReminder
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationService.sendAppointmentReminder', () => {
  const params = {
    userId: 'user-4',
    otherName: 'Dr. Lim',
    appointmentId: 'appt-4',
    scheduledAt: new Date('2026-06-03T08:00:00Z'),
    role: 'patient' as const,
  };

  it('creates exactly one notification', async () => {
    await NotificationService.sendAppointmentReminder(params);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
  });

  it('sends to correct user with appointment_reminder type', async () => {
    mockNotificationCreate.mockResolvedValue(makeNotification({ type: 'appointment_reminder' }));
    await NotificationService.sendAppointmentReminder(params);
    const call = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.userId).toBe('user-4');
    expect(call.type).toBe('appointment_reminder');
  });

  it('includes counterpart name in message', async () => {
    await NotificationService.sendAppointmentReminder(params);
    const call = mockNotificationCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(call.message as string).toContain('Dr. Lim');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pusher failure is non-fatal
// ─────────────────────────────────────────────────────────────────────────────

describe('Pusher failure graceful degradation', () => {
  it('does not throw when Pusher trigger fails', async () => {
    mockTrigger.mockRejectedValueOnce(new Error('Pusher unavailable'));
    await expect(
      NotificationService.sendRecordAvailable({
        patientId: 'p-5',
        doctorName: 'Test',
        appointmentId: 'appt-5',
      })
    ).resolves.not.toThrow();
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
  });
});
