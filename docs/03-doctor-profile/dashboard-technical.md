# Dashboards & Navigation — Technical Documentation

## Route Group Layout Architecture

AlalAI uses Next.js 14 App Router route groups to separate the two roles:

```
src/app/
├── (auth)/        — login, register (no nav shell)
├── (patient)/     — all patient routes share PatientLayout
└── (doctor)/      — all doctor routes share DoctorLayout
```

### `(patient)/layout.tsx`
**File**: `src/app/(patient)/layout.tsx`

Server Component. On every request:
1. Calls `auth()` to get the session
2. Redirects to `/login` if no session
3. Redirects to `/doctor/dashboard` if role is not `patient`
4. Renders the sidebar shell (`PatientNav`) + `{children}` in a flex layout

```tsx
<div className="flex h-screen overflow-hidden bg-gray-50">
  <aside className="hidden md:flex w-60 shrink-0 bg-white border-r flex-col">
    <PatientNav />
  </aside>
  <main className="flex-1 overflow-y-auto">{children}</main>
</div>
```

The sidebar is hidden on mobile (`hidden md:flex`) — a mobile hamburger menu is a future polish item.

### `(doctor)/layout.tsx`
Identical pattern with role check for `'doctor'`.

---

## Dashboard Pages

### Patient Dashboard (`src/app/(patient)/dashboard/page.tsx`)
Server Component — fetches directly from DB without an API call.

**Data fetched** (parallel `Promise.all`):
- `Appointment.find({ patientId, scheduledAt: { $gte: now }, status: pending|confirmed })` — up to 3
- `Notification.countDocuments({ userId, isRead: false })` — unread badge count

Then fetches doctor names via `User.find({ _id: { $in: doctorIds } })`.

**No client-side fetch** — data is inline in the HTML on first load. TanStack Query is NOT used here (no `useQuery`) because this is a static RSC snapshot; real-time updates to appointments happen via the appointments list page.

### Doctor Dashboard (`src/app/(doctor)/dashboard/page.tsx`)
Server Component. Requires `DoctorProfile` to exist.

**Data fetched** (parallel `Promise.all`):
- Today's appointments (scheduledAt within today's UTC day bounds)
- `Appointment.countDocuments({ doctorId, status: 'pending' })` — pending count
- `Appointment.distinct('patientId', { doctorId, status: confirmed|completed })` — unique patient count

---

## Navigation Components

### `PatientNav` (`src/components/layout/PatientNav.tsx`)
Client Component (`'use client'`).

- Uses `usePathname()` to highlight the active nav item (`pathname.startsWith(href)`)
- Uses `useCurrentUser()` hook to display name/avatar in the footer (staleTime 5min)
- `signOut({ callbackUrl: '/login' })` from `next-auth/react` for logout

### `DoctorNav` (`src/components/layout/DoctorNav.tsx`)
Client Component. Uses `useSession()` from `next-auth/react` for the user's name in the footer (no extra fetch needed — session is already in memory from NextAuth).

### Active state logic
```ts
const active = pathname === href || pathname.startsWith(`${href}/`);
```
This handles both exact matches (`/dashboard`) and nested routes (`/appointments/[id]`).

---

## Security

- **Layout-level role enforcement**: both layouts call `auth()` server-side and redirect wrong roles immediately — no flash of wrong UI
- **Dashboard data ownership**: all DB queries filter by `session.user.id` — users cannot see each other's data
- **No `passwordHash` leakage**: `sanitizeUser()` is applied to all User documents fetched for doctor/patient name lookups

---

## Known Limitations

- Mobile navigation is not yet implemented — sidebar is hidden on small screens (`hidden md:flex`)
- Doctor dashboard stats (total patients via `distinct`) load synchronously with the page — for very large patient lists this could be slow; a future enhancement would use a pre-aggregated counter
- Patient dashboard does not auto-refresh appointment status in real-time — Pusher notification events will trigger a toast but not update the dashboard card (the appointments list page does live-refresh via TanStack Query invalidation)
