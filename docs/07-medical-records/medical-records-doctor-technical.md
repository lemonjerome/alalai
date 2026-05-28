# Medical Records — Doctor Technical Documentation

## API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/medical-records` | patient | Patient's own records, paginated, enriched |
| GET | `/api/medical-records/[appointmentId]` | patient or doctor | Single record (ownership required) |
| POST | `/api/medical-records/[appointmentId]` | doctor | Create record for an appointment |
| PATCH | `/api/medical-records/[appointmentId]` | doctor | Update within 72h window |
| GET | `/api/doctors/me/patients` | doctor | Unique patients list (aggregated from appointments) |

---

## Data Schema

### `MedicalRecord` (`src/models/MedicalRecord.ts`)

```ts
interface IMedicalRecord {
  appointmentId: Types.ObjectId; // unique — one record per appointment
  patientId:     Types.ObjectId;
  doctorId:      Types.ObjectId;
  consultationNotes: string;
  diagnosis:         string;
  prescriptions: {
    medication:   string;
    dosage:       string;
    frequency:    string;
    duration:     string;
    instructions: string;
  }[];
  followUpDate?: Date;
  attachments:   string[];
  createdAt:     Date;
  updatedAt:     Date;
}
```

Key constraint: `appointmentId` has a **unique index** — attempting to insert a second record for the same appointment returns a MongoDB duplicate key error (caught and returned as HTTP 409).

---

## Route Design

### `GET /api/medical-records` (patient)

`src/app/api/medical-records/route.ts`

1. Restricted to `roles: ['patient']`
2. Paginates with `page` + `limit` (max 20)
3. Fetches records filtered by `patientId: req.session.user.id`
4. Enriches with parallel `$in` queries:
   - `Appointment.find({ _id: { $in: apptIds } })`
   - `User.find({ _id: { $in: doctorIds } }).select('name profilePictureUrl')`
5. Returns: `{ records: enrichedArray, total, page, pages }`

### `GET /api/medical-records/[appointmentId]`

`src/app/api/medical-records/[appointmentId]/route.ts`

Ownership check:
```ts
const isOwner = String(record.patientId) === userId || String(record.doctorId) === userId;
if (!isOwner) return 403;
```
No role restriction — both patient and doctor of the appointment can view the record.

### `POST /api/medical-records/[appointmentId]` (doctor)

`src/app/api/medical-records/[appointmentId]/route.ts`

Sequential checks before creation:
1. Validate `appointmentId` as ObjectId
2. Parse body against `createMedicalRecordSchema` (Zod)
3. Fetch appointment; 404 if not found
4. Verify `appointment.doctorId === session.user.id` (403 if mismatch)
5. Check no existing record (`MedicalRecord.findOne({ appointmentId })`) — 409 if found
6. Create record with `{ appointmentId, patientId: appointment.patientId, doctorId: appointment.doctorId, ...parsed.data }`
7. Best-effort notification: `NotificationService.sendRecordAvailable(...)` in try/catch (non-fatal)

### `PATCH /api/medical-records/[appointmentId]` (doctor)

72-hour edit window:
```ts
const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;
const ageMs = Date.now() - record.createdAt.getTime();
if (ageMs > EDIT_WINDOW_MS) {
  return NextResponse.json({ error: 'Medical records can only be edited within 72 hours of creation' }, { status: 403 });
}
```

Update uses `findOneAndUpdate` with `{ appointmentId, doctorId }` filter to enforce double ownership at the DB level even after the explicit check:
```ts
const updated = await MedicalRecord.findOneAndUpdate(
  { appointmentId, doctorId: req.session.user.id },
  { $set: parsed.data },
  { new: true }
);
```

---

## Zod Schemas

`src/lib/validations/medicalRecord.ts`

```ts
export const prescriptionSchema = z.object({
  medication:   z.string().min(1),
  dosage:       z.string().min(1),
  frequency:    z.string().min(1),
  duration:     z.string().min(1),
  instructions: z.string().default(''),
});

export const createMedicalRecordSchema = z.object({
  consultationNotes: z.string().min(1),
  diagnosis:         z.string().min(1),
  prescriptions:     z.array(prescriptionSchema).default([]),
  followUpDate:      z.string().datetime().optional(),
  attachments:       z.array(z.string().url()).default([]),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial();
```

---

## Patients Route

`src/app/api/doctors/me/patients/route.ts`

Uses `Appointment.distinct('patientId', { doctorId, status: { $ne: 'cancelled' } })` to get a deduplicated list of patient ObjectIds. This is more efficient than a `$group` aggregation pipeline for this read pattern.

Pagination is applied to the raw array after `.distinct()`:
```ts
const pagePatientIds = patientIds.slice(skip, skip + limit);
```

Returns parallel `User` + `PatientProfile` lookups, merged by `userId`.

---

## Security

- All mutation endpoints require `roles: ['doctor']`
- GET endpoint allows both roles but enforces ownership at the record level (not role level)
- `appointmentId` is validated as a MongoDB ObjectId before every DB call
- `findOneAndUpdate` filter includes `doctorId: req.session.user.id` as a second safety layer

---

## Notification Trigger Point

`NotificationService.sendRecordAvailable` is called immediately after record creation:
```ts
await NotificationService.sendRecordAvailable({
  patientId: String(appointment.patientId),
  doctorName: sanitizeUser(doctorUser!)?.name ?? 'Doctor',
  appointmentId: String(appointment._id),
});
```

This is wrapped in try/catch — a Pusher failure does not fail the record creation.

---

## Known Limitations

- Attachments are stored as URL strings (Cloudinary URLs); no upload endpoint exists yet for record attachments — only profile pictures are uploaded to Cloudinary in this MVP
- The 72h window is server-clock based; if the server clock drifts, the window may be slightly off
- No soft-delete for records — once created, records persist permanently
- `MedicalRecord.find({ patientId })` does not verify the appointment status; a record tied to a cancelled appointment (if somehow created) would still be visible
