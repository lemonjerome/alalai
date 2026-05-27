# Authentication — Technical Documentation

## Architecture Overview

Authentication uses **NextAuth.js v5** (beta) with a **Credentials provider** and **JWT session strategy**. There is no external OAuth provider — users register and log in with email/password managed inside MongoDB.

## Key Files
| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth configuration: provider, jwt/session callbacks |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth catch-all API handler |
| `src/middleware.ts` | Edge middleware: route protection and role-based redirects |
| `src/lib/api-guard.ts` | `withAuth()` HOF for API route protection |

## NextAuth v5 Configuration (`src/lib/auth.ts`)

### Credentials Provider
```ts
async authorize(credentials) {
  // 1. Validate shape with loginSchema (Zod)
  // 2. connectDB()
  // 3. User.findOne({ email }).select('+passwordHash') — explicit select needed
  // 4. bcrypt.compare(password, user.passwordHash)
  // 5. If doctor: look up DoctorProfile to attach doctorProfileId
  // 6. Return { id, email, name, image, role, doctorProfileId }
}
```

`passwordHash` uses `select: false` in the Mongoose schema — it is excluded from all queries by default. The `+passwordHash` projection is required only in the authorize function.

### JWT Token Payload
```ts
interface JWT {
  id: string;           // MongoDB ObjectId as string
  role: 'patient' | 'doctor';
  doctorProfileId?: string;  // Only for doctors
}
```

The `jwt` callback runs on every sign-in. On first call (`user` is present), the custom fields are injected. On subsequent calls (token refresh), the fields are already there.

### Session Object
```ts
session.user = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'patient' | 'doctor';
  doctorProfileId?: string;
}
```

The `session` callback maps JWT fields to the session object. This is what `useSession()` returns on the client.

### Why JWT (not Database Sessions)?
- Vercel serverless functions are stateless — no persistent memory.
- JWT avoids a DB round-trip on every request to validate the session.
- The trade-off is that token revocation requires waiting for expiry (30 days). For a healthcare MVP this is acceptable; a production system would add a token revocation list in Redis.

## Middleware (`src/middleware.ts`)

Uses NextAuth's `auth()` as the middleware function. The `req.auth` object is the session if authenticated, or `null` if not.

### Route Rules
| Pattern | Behaviour |
|---|---|
| `/`, `/login`, `/register` | Always public |
| `/api/auth/*` | Handled by NextAuth — never intercepted |
| `/api/health` | Public — monitoring endpoint |
| No session | Redirect to `/login?callbackUrl=<original path>` |
| `/patient/*` accessed by doctor | Redirect to `/doctor/dashboard` |
| `/doctor/*` accessed by patient | Redirect to `/patient/dashboard` |
| `/api/doctors/me/*` accessed by patient | `403 Forbidden` |

### Matcher Config
```ts
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```
Skips all static assets. All other routes go through middleware.

## API Guard (`src/lib/api-guard.ts`)

`withAuth(handler, { roles? })` is a higher-order function that wraps any App Router route handler:

```ts
export const GET = withAuth(async (req) => {
  const { id, role } = req.session.user;  // guaranteed to exist
  // ...
}, { roles: ['doctor'] });
```

### What it does:
1. Calls `auth()` to retrieve the session.
2. Returns `401 Unauthorized` if no session exists.
3. Returns `403 Forbidden` if `roles` is specified and user's role is not in the list.
4. Attaches `req.session` to the request object.
5. Calls the wrapped handler.

### Three-layer Security Model
1. **Middleware** — blocks unauthenticated users and wrong-role navigation at the edge.
2. **`withAuth` HOF** — enforces auth at the API level; any route that touches user data must use it.
3. **Data-level ownership** — every DB query includes `{ patientId: session.user.id }` or `{ doctorId: session.user.id }` so users can only read/write their own data even if they guess another user's ID.

## bcrypt Cost Factor
Cost factor **12** is used. This means each hash takes ~250ms on a modern CPU:
- Slow enough to make brute-force attacks expensive.
- Fast enough to not noticeably delay login for real users.

## TypeScript Module Augmentation
NextAuth's `User`, `JWT`, and `Session` interfaces are extended in `auth.ts` using declaration merging:
```ts
declare module 'next-auth' {
  interface Session { user: { id: string; role: UserRole; doctorProfileId?: string } & DefaultSession['user'] }
  interface User { role: UserRole; doctorProfileId?: string }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string; role: UserRole; doctorProfileId?: string }
}
```
This ensures TypeScript knows about `role` and `id` on `session.user` without casting.

## Known Limitations
- No email verification — anyone can register with any email address.
- No password reset flow — requires manual DB update or admin tooling.
- JWT revocation not implemented — a compromised session token remains valid until expiry (30 days).
- `doctorProfileId` in the JWT can become stale if the doctor profile is deleted — this edge case is not handled in the current MVP.
