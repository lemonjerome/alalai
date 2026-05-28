# Security — Technical Documentation

## Security Hardening Checklist

### ✅ Security Headers (`next.config.ts`)

Applied to all routes via `headers()`:

```ts
{ key: 'X-Content-Type-Options', value: 'nosniff' }
{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
{ key: 'Content-Security-Policy', value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self'",
  "frame-src 'self' https://meet.jit.si",   // Jitsi video
  "connect-src 'self' https://*.pusher.com wss://*.pusher.com",
].join('; ') }
```

`unsafe-eval` in `script-src` is required for Next.js development server; in production this can be tightened with nonces if needed.

### ✅ Authentication — bcrypt

`bcryptjs.hash(password, 12)` — cost factor 12 (~250ms per hash on modern hardware, slow enough to resist brute force).

### ✅ JWT Sessions

NextAuth v5 using JWT sessions (not database sessions):
- Token payload: `{ sub: userId, role, email, name, doctorProfileId? }`
- Secret: `NEXTAUTH_SECRET` env var
- Session expiry: NextAuth default (30 days)
- Rotation: re-issue on each request in session callback

### ✅ Rate Limiting (`src/lib/rate-limit.ts`)

Using `@upstash/ratelimit` with sliding window:

| Limiter | Limit | Identifier |
|---|---|---|
| `auth` | 5 req / 10 min | IP address |
| `mutation` (booking) | 10 req / 60s | `book:{userId}` |
| `mutation` (records) | 10 req / 60s | `record:{userId}` |

Rate limiting is disabled in `NODE_ENV=test` and when `DISABLE_RATE_LIMIT=true` to prevent test failures.

### ✅ ObjectId Validation

Every route with an `[id]` param calls `mongoose.Types.ObjectId.isValid(id)` before any DB operation. Returns 400 on invalid format. Prevents MongoDB injection via malformed ObjectIds.

### ✅ Ownership Enforcement

All data queries include the session user's ID in the filter:
- `{ patientId: session.user.id }` — prevents patients from seeing other patients' data
- `{ doctorId: session.user.id }` — prevents doctors from seeing other doctors' appointment data
- `findOneAndUpdate({ appointmentId, doctorId: session.user.id })` — double-ownership at DB level

### ✅ Response Sanitization (`sanitizeUser`)

`src/lib/utils.ts`:
```ts
export function sanitizeUser<T extends { passwordHash?: unknown }>(
  user: T
): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
```
Called on every `User` document before returning from an API route.

### ✅ Role-Based Access Control (RBAC)

Two layers:
1. **Middleware** (`src/middleware.ts`): pathname prefix checks (`/doctor/` → doctor only)
2. **`withAuth` HOF** (`src/lib/api-guard.ts`): `roles` array checked on session `.role` field before handler runs

### ✅ Pusher Channel Authorization

`src/app/api/pusher/auth/route.ts` verifies that the requested channel matches `private-user-${session.user.id}`. Prevents a user from subscribing to another user's notification channel.

---

## MongoDB Atlas Network Access

Atlas is configured with `0.0.0.0/0` (allow all IPs) — required for Vercel's dynamic IP pool. Authentication is the security layer:
- Connection string includes username + password with least-privilege role (readWrite on the `alalai` database)
- Atlas access logs are monitored for anomalous patterns

For production hardening, consider restricting to Vercel's static outbound IPs or using Atlas Private Endpoints.

---

## Environment Variables

Never committed to the repo. All secrets live in Vercel's environment variable dashboard:
- `NEXTAUTH_SECRET` — JWT signing secret (rotate if compromised)
- `MONGODB_URI` — includes credentials
- `PUSHER_SECRET` — server-side Pusher signing
- `CRON_SECRET` — Bearer token for cron endpoint authorization
- Cloudinary and Upstash credentials

`.env.example` lists all required variable names without values. `.env.local` is in `.gitignore`.

---

## Health Check Endpoint

`GET /api/health` — returns `{ status: 'ok', timestamp: ISO8601 }`. No auth required.

Exempted from rate limiting and from session middleware (explicitly allowed in `PUBLIC_ROUTES`). Used by:
- Vercel uptime checks
- External monitoring (UptimeRobot, etc.)

---

## Known Security Trade-offs

| Trade-off | Decision | Mitigation |
|---|---|---|
| `unsafe-eval` in CSP | Required by Next.js dev tooling | Acceptable for MVP; tighten with nonces in production |
| Atlas `0.0.0.0/0` | Vercel has dynamic IPs | Atlas auth + least-privilege DB user |
| Jitsi room IDs are the appointmentId | ObjectId (24 hex chars) is long enough to be unguessable | Self-hosted Jitsi + token auth for production |
| 72h edit window is server-clock based | Simpler than event sourcing | ±seconds acceptable for this use case |
| No password reset flow | Out of scope for MVP | Plan for Phase 9 |
