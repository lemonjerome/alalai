# Patient Profile — Technical Documentation

## API Endpoints

### `GET /api/users/me`
Returns the current user merged with their role-specific profile.

**Response:**
```json
{
  "user": { "_id", "email", "name", "phone", "role", "profilePictureUrl", "createdAt" },
  "profile": { ...PatientProfile or DoctorProfile fields }
}
```
- `passwordHash` is always stripped via `sanitizeUser()` before returning.
- The profile field is `null` if the role profile doesn't exist yet (shouldn't happen after registration).

### `PATCH /api/users/me`
Partially updates the User document. Only allows: `name`, `phone`, `profilePictureUrl`.

**Validated by:** `updateUserSchema` (Zod) — protects against updating `email`, `role`, `passwordHash`.

### `GET /api/users/me/patient-profile`
Returns the PatientProfile for the authenticated patient. `403` for doctors.

### `PATCH /api/users/me/patient-profile`
Updates the PatientProfile. Uses `upsert: true` so it creates the document if missing.

**Validated by:** `updatePatientProfileSchema` — all fields optional.

### `POST /api/users/me/avatar`
Accepts `multipart/form-data` with an `avatar` field (File).

**Validation:**
- Content type must be `image/jpeg`, `image/png`, `image/webp`, or `image/gif`
- Max 5 MB
- File is converted to a Buffer, uploaded to Cloudinary

**Cloudinary upload options:**
```ts
{
  folder: 'alalai/avatars',
  public_id: `user-${userId}`,    // deterministic ID = overwrites on re-upload
  transformation: [
    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    { quality: 'auto', fetch_format: 'auto' },
  ]
}
```
The `public_id` is deterministic so re-uploading replaces the old image without orphaning files.

## Key Files
| File | Purpose |
|---|---|
| `src/app/api/users/me/route.ts` | GET/PATCH current user |
| `src/app/api/users/me/patient-profile/route.ts` | GET/PATCH patient health info |
| `src/app/api/users/me/avatar/route.ts` | POST avatar upload |
| `src/lib/cloudinary.ts` | Cloudinary SDK config + `uploadToCloudinary()` |
| `src/lib/validations/user.ts` | `updateUserSchema`, `updatePatientProfileSchema` |
| `src/hooks/useCurrentUser.ts` | TanStack Query hooks for all profile operations |
| `src/components/profile/AvatarUpload.tsx` | Click-to-upload avatar with instant preview |
| `src/components/profile/PersonalInfoForm.tsx` | Name/phone edit form |
| `src/components/profile/HealthInfoForm.tsx` | Health info edit form |
| `src/app/(patient)/profile/page.tsx` | Profile page (client component, tabs) |

## `sanitizeUser()` Helper
Located in `src/lib/utils.ts`. Destructures out `passwordHash` before returning any User document from an API route. Must be called on every User object returned to the client.

## TanStack Query Strategy
- `staleTime: 5 * 60 * 1000` (5 min) — user data doesn't change often
- After PATCH success, `invalidateQueries(['currentUser'])` forces a fresh fetch
- `useUploadAvatar` uses optimistic local preview: `FileReader` renders the image before upload completes; preview is reverted on error

## Security
- All routes protected by `withAuth()` HOF — unauthenticated → 401
- Patient-profile routes use `{ roles: ['patient'] }` — doctor → 403
- Avatar upload validates MIME type + size server-side (not just client-side)
- `profilePictureUrl` is the only way to update the avatar URL — it cannot be set directly via PATCH `/api/users/me` from a client-supplied URL (the PATCH schema allows it for internal use, but the avatar flow goes through Cloudinary validation first)

## Known Limitations
- No email change flow
- No password change flow
- Doctor profile edit (bio, specialization, availability) is in Phase 3.1
