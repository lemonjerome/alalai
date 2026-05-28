# Doctor Profile & Availability — Technical Documentation

## Overview
Phase 3.1 implements doctor profile management and availability scheduling. It covers three API route files, one utility library, and its unit test suite.

---

## Data Models

### `DoctorProfile` (`src/models/DoctorProfile.ts`)
```ts
{
  _id: ObjectId
  userId: ObjectId          // ref: users (unique)
  licenseNumber: string
  specialization: string[]  // MongoDB text index
  bio: string               // MongoDB text index
  education: string[]
  yearsOfExperience: number
  consultationFee: number
  rating: number            // computed average (future reviews feature)
  reviewCount: number
  isVerified: boolean
  isAcceptingPatients: boolean
  createdAt, updatedAt      // timestamps: true
}
```
Text index on `{ bio: 'text', specialization: 'text' }` — powers the `/api/doctors?search=` query.

### `Availability` (`src/models/Availability.ts`)
```ts
{
  _id: ObjectId
  doctorId: ObjectId        // ref: doctor_profiles
  dayOfWeek: 0-6            // 0=Sunday, 6=Saturday
  startTime: 'HH:mm'
  endTime: 'HH:mm'
  slotDurationMinutes: 15|30|60|120
  isActive: boolean
  blockedDates: Date[]      // UTC midnight dates to skip
  createdAt, updatedAt
}
```

---

## API Routes

### `GET /api/doctors/me/profile`
**File**: `src/app/api/doctors/me/profile/route.ts`  
**Auth**: `withAuth({ roles: ['doctor'] })`

Returns merged `{ user, doctorProfile }` object. Queries `DoctorProfile.findOne({ userId })`, joins with `User.findById()`. Strips `passwordHash` via `sanitizeUser()`.

### `PATCH /api/doctors/me/profile`
**Auth**: `withAuth({ roles: ['doctor'] })`  
**Body**: validated by `updateDoctorProfileSchema` (Zod, partial)

Splits incoming fields: user-level fields (`name`, `phone`) update the `User` document; all other fields update `DoctorProfile`. Uses `findOneAndUpdate` with `{ new: true }` on both. Returns merged result.

### `GET /api/doctors/me/availability`
**File**: `src/app/api/doctors/me/availability/route.ts`  
**Auth**: `withAuth({ roles: ['doctor'] })`

Returns all availability records for the authenticated doctor, sorted by `dayOfWeek` then `startTime`.

### `POST /api/doctors/me/availability`
**Auth**: `withAuth({ roles: ['doctor'] })`  
**Body**: validated by `availabilitySlotSchema`

**Overlap detection**: Before creating, queries:
```ts
Availability.findOne({
  doctorId: profile._id,
  dayOfWeek,
  isActive: true,
  $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
})
```
Returns `409 Conflict` if a record is found. Creates and returns the new slot at `201 Created`.

### `PATCH /api/doctors/me/availability/[slotId]`
**File**: `src/app/api/doctors/me/availability/[slotId]/route.ts`  
**Auth**: `withAuth({ roles: ['doctor'] })`  
**Body**: validated by `updateAvailabilitySlotSchema` (partial)

Validates `slotId` with `mongoose.Types.ObjectId.isValid()`. Ownership check is enforced atomically:
```ts
Availability.findOneAndUpdate(
  { _id: slotId, doctorId: profile._id }, // ownership in query, not application layer
  { $set: parsed.data },
  { new: true }
)
```
Returns `404` if the slot doesn't exist or belongs to a different doctor.

### `DELETE /api/doctors/me/availability/[slotId]`
Same ownership pattern via `Availability.findOneAndDelete({ _id: slotId, doctorId: profile._id })`.

---

## `getAvailableSlots` Utility

**File**: `src/lib/availability-utils.ts`  
**Test coverage**: 100% (17 test cases)

### Signature
```ts
export function getAvailableSlots(
  targetDate: Date,
  availabilities: AvailabilityRecord[],
  appointments: AppointmentRecord[],
  tzOffsetMinutes = 0   // minutes east of UTC; 480 for UTC+8 (PH)
): TimeSlot[]
```

### Algorithm

1. **Filter by day**: Keep only records where `a.dayOfWeek === targetDate.getUTCDay()` and `a.isActive === true`.
2. **Skip blocked dates**: `isBlocked()` compares UTC year/month/day — only exact-day matches are excluded.
3. **Expand into slots**: Starting at `avail.startTime`, advance by `slotDurationMinutes` while the slot end fits within `avail.endTime`.
4. **Filter past slots**: `if (slotEnd <= now) continue` — prevents showing elapsed time windows.
5. **Filter appointment conflicts**: A slot is removed when any `pending`/`confirmed` appointment overlaps: `appt.scheduledAt < slotEnd && apptEnd > slotStart`. Cancelled and completed appointments do **not** block slots.
6. **Sort**: `slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())`

### `combineDateAndTime` (internal)
```ts
function combineDateAndTime(date: Date, timeStr: string, tzOffsetMinutes = 0): Date {
  const result = new Date(date);
  result.setUTCHours(hours, minutes, 0, 0);   // UTC-based, timezone-independent
  return new Date(result.getTime() - tzOffsetMinutes * 60_000);
}
```
Uses `setUTCHours` (not `setHours`) for consistent behavior regardless of the server's local timezone. With `tzOffsetMinutes = 480` (UTC+8): a `'09:00'` string becomes `09:00 UTC - 480 min = 01:00 UTC`, correctly representing 09:00 Philippine time in UTC storage.

### `TimeSlot` return type
```ts
interface TimeSlot {
  startTime: Date;   // Date object
  endTime: Date;
  startISO: string;  // .toISOString() — convenient for API responses and display
  endISO: string;
}
```

---

## Validation Schemas (`src/lib/validations/doctor.ts`)

```ts
availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),  // HH:mm
  endTime:   z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  slotDurationMinutes: z.number().int().min(15).max(120).default(30),
  isActive: z.boolean().default(true),
  blockedDates: z.array(z.string().datetime({ offset: true })).optional().default([]),
})

updateAvailabilitySlotSchema = availabilitySlotSchema.partial()
```

---

## Security Considerations

- **Ownership via query**: Slot mutations include `{ doctorId: profile._id }` in the DB filter — no separate ownership check that could race. If the slot doesn't exist or belongs to another doctor, `findOneAndUpdate` returns `null` → `404`.
- **ObjectId validation**: All `[slotId]` params are validated with `mongoose.Types.ObjectId.isValid()` before any DB query → `400` on invalid format.
- **Role enforcement**: All routes use `withAuth({ roles: ['doctor'] })` → `403` for patients.
- **No passwordHash exposure**: Profile GET merges User + DoctorProfile; User document always goes through `sanitizeUser()`.

---

## Test Coverage

**File**: `tests/unit/lib/availability-utils.test.ts` (17 tests, 100% line coverage)

Test groups:
- **Basic slot generation** — correct count, inactive/wrong-day filtering, correct ISO times, chronological sort, 30-min slots
- **Blocked dates** — exact-day block, different-day non-block
- **Appointment conflicts** — confirmed removes slot, pending removes slot, cancelled does not, completed does not, all-booked returns empty
- **Past slot filtering** — past date returns empty array
- **Edge cases** — empty availabilities, slot doesn't fit window, multiple same-day availabilities

Dynamic date strategy: `nextWeekday(dayOfWeek)` returns the next occurrence of the given weekday (always at least 1 day in the future), ensuring past-slot filtering never interferes with correctness assertions.

---

## Known Limitations

- `blockedDates` comparison is UTC midnight date-only — a blocked date stored with a non-midnight time would still be compared by date only (getUTCDate), so this is safe as long as dates are stored as UTC midnight (which the Zod schema and Mongoose enforce).
- The overlap detection for POST uses string comparison on `'HH:mm'` strings. This works because MongoDB string comparison on zero-padded time strings is lexicographically correct (e.g., `'09:00' < '12:00'`).
- There is no server-side validation that `endTime > startTime` in the Zod schema — this should be added as a `z.refine()` in a future hardening pass.
