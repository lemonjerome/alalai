# Appointment Booking — Technical Documentation

## Data Model

```ts
// src/models/Appointment.ts
{
  _id: ObjectId
  patientId: ObjectId     // ref: users
  doctorId: ObjectId      // ref: users (NOT DoctorProfile)
  doctorProfileId: ObjectId // ref: doctor_profiles (for discovery join)
  scheduledAt: Date       // UTC
  durationMinutes: number // 15–120
  status: 'pending'|'confirmed'|'cancelled'|'completed'|'no_show'
  cancellationReason: string
  rescheduledFrom: ObjectId | null  // ref: appointments (audit trail)
  jitsiRoomId: string     // 'alalai-{_id}'
  reminderSentAt: Date | null
  createdAt, updatedAt
}
```

**Indexes**: `patientId+scheduledAt`, `doctorId+scheduledAt`, `doctorId+scheduledAt+status`

---

## API Routes

### `POST /api/appointments`
**File**: `src/app/api/appointments/route.ts`  
**Auth**: `withAuth({ roles: ['patient'] })`  
**Body**: `{ doctorId (DoctorProfile._id), scheduledAt (ISO), durationMinutes }`

**Booking validation algorithm**:
1. Resolve `DoctorProfile._id` → get `doctorProfile.userId` (the User ID stored on appointments)
2. Fetch doctor's active `Availability` records
3. Fetch existing `pending`/`confirmed` appointments for that day
4. Call `getAvailableSlots(requestedDate, avails, existingAppts)`
5. Check that the requested ISO time exactly matches a slot's `startISO`
6. Return `409` if slot not found; otherwise create appointment with `jitsiRoomId: 'alalai-{_id}'`

**Jitsi room ID**: `alalai-${appointmentId.toString()}` — deterministic, room is accessible to both parties at `/consultation/[appointmentId]`.

### `GET /api/appointments`
**Auth**: `withAuth({ roles: ['patient'] })`  
Returns patient's own appointments with optional `status` filter, paginated.

### `GET /api/appointments/[id]`
**File**: `src/app/api/appointments/[id]/route.ts`  
**Auth**: Any authenticated user  
Verifies `patientId` or `doctorId` matches `session.user.id` — ownership check without role restriction.

### `PATCH /api/appointments/[id]/reschedule`
**Auth**: `withAuth({ roles: ['patient'] })`  
**Body**: `{ scheduledAt (ISO) }`

1. Verifies `patientId` matches session user
2. Confirms status is `pending` or `confirmed`
3. Validates new slot availability (same algorithm as POST, but excludes current appointment from conflict check via `$ne`)
4. Creates new `Appointment` with `rescheduledFrom: oldId`, `status: 'confirmed'`
5. Updates old appointment to `status: 'cancelled', cancellationReason: 'Rescheduled by patient'`
6. Both operations run in `Promise.all` (not a transaction — acceptable for MVP; atomic transactions would require MongoDB replica set)

### `PATCH /api/appointments/[id]/cancel`
**Auth**: Patient or doctor (checked via ownership)  
**Body**: `{ cancellationReason (min 5 chars) }`  
Returns `409` if already cancelled or completed.

### `PATCH /api/appointments/[id]/complete`
**Auth**: `withAuth({ roles: ['doctor'] })`  
Verifies `doctorId` matches session. Only allowed if status is `'confirmed'`.

### `GET /api/doctors/me/appointments`
**Auth**: `withAuth({ roles: ['doctor'] })`  
Query params: `status`, `from`, `to` (ISO dates), `page`, `limit` (max 50).

---

## Validation Schemas (`src/lib/validations/appointment.ts`)

```ts
createAppointmentSchema: { doctorId, scheduledAt (ISO 8601), durationMinutes (15–120, default 30) }
rescheduleAppointmentSchema: { scheduledAt (ISO 8601) }
cancelAppointmentSchema: { cancellationReason (min 5 chars) }
```

---

## Component Architecture

### `BookingWizard` (`src/components/appointments/BookingWizard.tsx`)
Client Component managing a 3-step local state machine: `'date' | 'slot' | 'confirm' | 'success'`

- **Step 1 (date)**: renders shadcn `Calendar` with `availableDays` set from `useDoctorAvailability`
- **Step 2 (slot)**: renders `TimeSlotPicker` with slots for the selected day
- **Step 3 (confirm)**: renders summary + `useBookAppointment` mutation trigger
- **Step 4 (success)**: confirmation screen with links to appointments list

If `initialSlot` is provided (from `?slot=` URL param), wizard starts at Step 3 (Confirm) directly.

### `AppointmentCard` (`src/components/appointments/AppointmentCard.tsx`)
Client Component. Displays one appointment with:
- Status badge
- Counterpart name (doctor name for patient, patient name for doctor)
- Date/time/duration
- **Join** button (link to `/consultation/[id]`, disabled outside ±15 min window via `canJoin()`)
- **Complete** button (doctor only, confirmed appointments)
- **Cancel** button (pending/confirmed only) → opens `CancelDialog`

**`canJoin()` logic**:
```ts
function canJoin(scheduledAt: Date): boolean {
  return Math.abs(Date.now() - scheduledAt.getTime()) <= 15 * 60 * 1000;
}
```

### `CancelDialog` (`src/components/appointments/CancelDialog.tsx`)
Modal with a `Textarea` for cancellation reason. Validates minimum 5 chars client-side before enabling the confirm button.

### `TimeSlotPicker` (`src/components/appointments/TimeSlotPicker.tsx`)
Grid of `<button>` elements, one per slot. Selected slot highlighted with primary color.

---

## TanStack Query Hooks (`src/hooks/useAppointments.ts`)

| Hook | Purpose | staleTime |
|---|---|---|
| `useMyAppointments(status?)` | Patient: GET /api/appointments | 0 (always fresh) |
| `useDoctorAppointments(params)` | Doctor: GET /api/doctors/me/appointments | 0 |
| `useBookAppointment()` | POST /api/appointments | — mutation |
| `useCancelAppointment()` | PATCH /api/appointments/[id]/cancel | — mutation |
| `useCompleteAppointment()` | PATCH /api/appointments/[id]/complete | — mutation |

All mutations invalidate `['appointments']` and `['doctorAvailability']` queryKeys on success.

---

## Security Notes

- **Patient ownership (POST)**: slot validation uses `doctorId` from `DoctorProfile` lookup — cannot be spoofed by passing an arbitrary doctor user ID
- **Reschedule**: excludes current appointment from conflict check with `$ne` — correctly handles "keep same slot" reschedules
- **GET [id]**: ownership verified via `patientId || doctorId === session.user.id` — no role restriction (both roles can view)
- **Complete**: role-restricted to doctor, plus `doctorId` ownership check on the document
- **Cancel**: both roles allowed, ownership checked without role restriction

---

## Known Limitations

- Reschedule is **not atomic** — if the `Appointment.create` succeeds but `findByIdAndUpdate` fails, the old appointment won't be cancelled. A MongoDB session/transaction would fix this but requires a replica set (not available on Atlas free tier).
- Appointment list pages don't show counterpart names (doctor/patient) — this requires a join query not currently implemented in the list hooks. A future enhancement adds these lookups.
- No server-side push when a new appointment is booked — the doctor's appointment list won't update until they refresh or TanStack Query refetches. Pusher (Phase 5) addresses this.
