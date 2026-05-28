# Medical Records — Patient Technical Documentation

## Page Architecture

```
src/app/(patient)/records/
├── page.tsx              — Client Component: paginated record list using usePatientRecords hook
└── [appointmentId]/
    └── page.tsx          — Server Component: full record detail with prescription card

src/components/medical-records/
├── AppointmentHistory.tsx  — Timeline list component (client, uses Link navigation)
├── PrescriptionCard.tsx    — Formatted prescription slip with print CSS
└── PrintButton.tsx         — Client component wrapping window.print()
```

---

## Data Flow

### Records List (`/records`)

1. Client Component renders `usePatientRecords(page)` TanStack Query hook
2. Hook fetches `GET /api/medical-records?page={n}&limit=10`
3. API joins each record with its `Appointment` (for `scheduledAt`) and `User` doctor record (for name, avatar)
4. `AppointmentHistory` renders the enriched list as a timeline

```ts
// src/hooks/usePatientRecords.ts
export interface EnrichedMedicalRecord extends MedicalRecord {
  appointment?: { _id: string; scheduledAt: string; durationMinutes: number; status: string };
  doctor?: { _id: string; name?: string; profilePictureUrl?: string };
}
```

### Record Detail (`/records/[appointmentId]`)

Server Component flow:
1. `auth()` → redirect if unauthenticated or wrong role
2. `mongoose.Types.ObjectId.isValid(appointmentId)` → `notFound()` if invalid
3. Parallel fetch: `MedicalRecord.findOne({ appointmentId })` + `Appointment.findById(appointmentId)`
4. If either is null → `notFound()`
5. Ownership check: `record.patientId === session.user.id` → `redirect('/records')` if mismatch
6. Fetch doctor `User` → `sanitizeUser()` for name
7. Render `Card` (diagnosis + notes) + `PrescriptionCard` (if prescriptions exist)
8. `PrintButton` (client component) shown only when prescriptions exist

---

## Components

### `AppointmentHistory` (`src/components/medical-records/AppointmentHistory.tsx`)

Renders a vertical timeline with a CSS `::before` line. Each item is a `<Link>` to `/records/{appointmentId}`. Empty state shows a calendar icon and message.

Data access: `record.appointment?.scheduledAt` with fallback to `record.createdAt` if appointment not enriched.

### `PrescriptionCard` (`src/components/medical-records/PrescriptionCard.tsx`)

Renders a formal prescription slip. Structure:
- Header: doctor name, platform name, consultation date
- Patient name
- Prescriptions table: medication | dosage | frequency | duration (with `instructions` as italic sub-row)
- Signature area with placeholder line

**Print CSS** (global via `<style jsx global>`):
```css
@media print {
  body * { visibility: hidden; }
  #prescription-card, #prescription-card * { visibility: visible; }
  #prescription-card { position: absolute; inset: 0; margin: 2rem; }
}
```
This hides everything on the page except the element with `id="prescription-card"` during printing.

### `PrintButton` (`src/components/medical-records/PrintButton.tsx`)

```tsx
'use client';
export function PrintButton() {
  return <Button onClick={() => window.print()}>Print Prescription</Button>;
}
```
This is a thin client component so that `window.print()` can be called without making the entire record detail page a client component (which would prevent RSC data fetching).

---

## API: `GET /api/medical-records`

`src/app/api/medical-records/route.ts`

- Role restriction: `patient` only
- Pagination: `page` + `limit` (max 20 per page)
- `MedicalRecord.find({ patientId: req.session.user.id }).sort({ createdAt: -1 })`
- Join queries run in parallel:
  - `Appointment.find({ _id: { $in: apptIds } })`
  - `User.find({ _id: { $in: doctorIds } }).select('name profilePictureUrl')`
- Returns enriched array

---

## Hook: `usePatientRecords`

`src/hooks/usePatientRecords.ts`

```ts
export function usePatientRecords(page = 1) {
  return useQuery({
    queryKey: ['patientRecords', page],
    queryFn: () => fetch(`/api/medical-records?page=${page}&limit=10`).then(r => r.json()),
    staleTime: 0,
  });
}
```

`staleTime: 0` ensures records are always fresh — after a consultation, the patient receives a real-time notification and expects to see the new record immediately on refresh.

---

## Security

- Server-side ownership check on the detail page: `record.patientId === session.user.id`
- API route uses `patientId: req.session.user.id` filter — ID is from the session, not the URL
- `sanitizeUser()` called on the doctor's user object before returning name (strips `passwordHash`)
- Redirect rather than 404 on ownership mismatch (prevents enumeration of valid appointment IDs)

---

## Known Limitations

- Records list is a **Client Component** because of pagination state — this means no RSC data on initial load; a loading skeleton is shown instead
- `PrescriptionCard` uses `<style jsx global>` for print CSS — if the app migrates to a different CSS-in-JS approach, this would need updating
- Print function uses `window.print()` which opens the browser's native print dialog — there's no PDF generation on the server
- Follow-up date in the record is informational only; there's no automatic booking suggestion or calendar integration
