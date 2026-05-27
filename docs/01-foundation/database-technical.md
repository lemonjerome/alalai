# Database — Technical Documentation

## Connection Pattern
File: [src/lib/db.ts](../../src/lib/db.ts)

Next.js serverless functions can cold-start many times. To prevent creating a new `mongoose.connect()` on every invocation, we cache the connection on `global.__mongoose`:

```typescript
const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };
```

- If `cached.conn` exists, return it immediately (warm connection)
- Otherwise, call `mongoose.connect()` once and store the promise
- On error, reset `cached.promise = null` so the next call retries

**Why not use `mongoose.connection.readyState`?**: The global cache is more reliable in serverless environments where the module cache may be partially evicted.

## Models

All models use `mongoose.models.X ?? mongoose.model(...)` to prevent "Cannot overwrite model once compiled" errors during hot-reload.

### User (`src/models/User.ts`)
```
email        String   unique, lowercase, indexed
passwordHash String   select: false (never returned in queries by default)
role         Enum     'patient' | 'doctor'
name         String
phone        String
profilePictureUrl String
timestamps   createdAt, updatedAt
```
**Note**: `passwordHash` has `select: false` — it's omitted from all `.find()` results unless explicitly included with `.select('+passwordHash')`.

### PatientProfile (`src/models/PatientProfile.ts`)
```
userId       ObjectId  ref: User, unique, indexed
dateOfBirth  Date
weight       Number    kg
height       Number    cm
bloodType    Enum      A+/A-/B+/B-/AB+/AB-/O+/O-
allergies    [String]
currentMedications [String]
medicalHistory String  free text
emergencyContact   { name, phone, relationship }
timestamps
```

### DoctorProfile (`src/models/DoctorProfile.ts`)
```
userId         ObjectId  ref: User, unique, indexed
licenseNumber  String
specialization [String]  indexed; text index for full-text search
bio            String    text index for full-text search
education      [String]
yearsOfExperience Number
consultationFee   Number
rating         Number    0-5, computed average
reviewCount    Number
isVerified     Boolean
isAcceptingPatients Boolean
timestamps
```
**Text index**: `{ bio: 'text', specialization: 'text' }` — enables `$text` search queries for the doctor discovery API.

### Availability (`src/models/Availability.ts`)
```
doctorId            ObjectId  ref: DoctorProfile, indexed
dayOfWeek           Number    0=Sun, 1=Mon, ..., 6=Sat
startTime           String    'HH:mm' regex validated
endTime             String    'HH:mm' regex validated
slotDurationMinutes Number    15-120 min
isActive            Boolean
blockedDates        [Date]    specific dates to skip
timestamps
Compound index: { doctorId, dayOfWeek }
```

### Appointment (`src/models/Appointment.ts`)
```
patientId        ObjectId  ref: User, indexed
doctorId         ObjectId  ref: User, indexed
doctorProfileId  ObjectId  ref: DoctorProfile
scheduledAt      Date
durationMinutes  Number
status           Enum      confirmed|cancelled|completed|no_show
cancellationReason String
rescheduledFrom  ObjectId  ref: Appointment (null if original)
jitsiRoomId      String    'alalai-${_id}'
reminderSentAt   Date|null  idempotency guard for cron reminders
timestamps
Compound indexes: { patientId, scheduledAt }, { doctorId, scheduledAt }, { doctorId, scheduledAt, status }
```

### MedicalRecord (`src/models/MedicalRecord.ts`)
```
appointmentId   ObjectId  ref: Appointment, unique (one record per appointment)
patientId       ObjectId  ref: User, indexed
doctorId        ObjectId  ref: User, indexed
consultationNotes String
diagnosis       String
prescriptions   [{ medication, dosage, frequency, duration, instructions }]
followUpDate    Date|null
attachments     [String]  Cloudinary URLs
timestamps
```

### Notification (`src/models/Notification.ts`)
```
userId   ObjectId  ref: User, indexed
type     Enum      appointment_booked|appointment_reminder|appointment_cancelled|
                   appointment_rescheduled|record_available
title    String
message  String
data     Mixed     arbitrary payload e.g. { appointmentId }
isRead   Boolean   indexed
timestamps
Compound index: { userId, isRead, createdAt }
```

## Index Strategy
- **Single-field indexes** on all `userId`, `patientId`, `doctorId` foreign keys — supports owner queries
- **Compound indexes** on appointment queries (most frequent query pattern: "give me this doctor's appointments from this week")
- **Text index** on DoctorProfile for search
- **Unique constraint** on `User.email`, `PatientProfile.userId`, `DoctorProfile.userId`, `MedicalRecord.appointmentId`

## Atlas Free Tier Constraints
- M0 cluster: 512 MB storage, shared compute
- Max 100 connections (mitigated by Next.js connection caching)
- No Atlas Search (use native `$text` index instead)
- No Atlas Triggers (use Vercel Cron instead for reminders)
