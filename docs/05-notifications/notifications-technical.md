# Notifications — Technical Documentation

## Architecture

Notifications use a two-layer delivery model:
1. **Database record** — persisted to MongoDB `notifications` collection; supports full history, unread queries, read/read-all mutations
2. **Pusher private channel event** — triggers instant browser update without polling

---

## `NotificationService` (`src/lib/notification-service.ts`)

The service exposes typed helpers for every notification event:

| Method | Sends to |
|---|---|
| `sendAppointmentBooked` | Both patient and doctor |
| `sendAppointmentCancelled` | Both patient and doctor |
| `sendAppointmentRescheduled` | Both patient and doctor |
| `sendAppointmentReminder` | One user (called once for patient, once for doctor) |
| `sendRecordAvailable` | Patient only |

**`send()` internal flow**:
1. `Notification.create(...)` — stores record first
2. Dynamic `import('@/lib/pusher')` — avoids bundling server SDK in client bundles
3. `pusher.trigger('private-user-${userId}', 'notification', payload)` — real-time push
4. Pusher errors are silently caught — notification is already persisted

---

## Pusher Private Channels

**Why private channels**: public channels are accessible to anyone with the key. Private channels require server-side authorization — the client is authenticated before being allowed to subscribe.

**Authorization flow**:
1. Pusher JS client calls `authEndpoint: '/api/pusher/auth'` with `socket_id` + `channel_name`
2. `POST /api/pusher/auth` verifies the session, checks `channel === 'private-user-${session.user.id}'`
3. Returns a signed auth token from `pusher.authorizeChannel(socketId, channel)`
4. Pusher JS uses the token to complete the subscription

**Security guarantee**: a user can only subscribe to their own `private-user-{id}` channel. Attempting to subscribe to another user's channel returns `403`.

**File**: `src/app/api/pusher/auth/route.ts`

---

## Notification API Routes

### `GET /api/notifications`
**File**: `src/app/api/notifications/route.ts`  
**Query params**: `unreadOnly=true`, `page`, `limit`  
Returns `{ notifications, total, page, pages, unreadCount }`.

`unreadCount` is always the total unread for the user (not filtered by `unreadOnly`) — used by `NotificationBell` for the badge regardless of filter.

### `PATCH /api/notifications/[id]/read`
**File**: `src/app/api/notifications/[id]/read/route.ts`  
Uses `findOneAndUpdate({ _id, userId })` — ownership enforced in query (atomic).

### `PATCH /api/notifications/read-all`
**File**: `src/app/api/notifications/read-all/route.ts`  
Uses `updateMany({ userId, isRead: false })`.

---

## `useNotifications` Hook (`src/hooks/useNotifications.ts`)

```ts
useNotifications(unreadOnly?: boolean) → { notifications, total, unreadCount, ... }
useMarkRead()   → mutation: mark single notification read
useMarkAllRead() → mutation: mark all read
usePusherNotifications(userId) → effect: Pusher subscription
```

### `usePusherNotifications(userId)`
Effect-based hook that:
1. Lazily `import('pusher-js')` (avoids SSR crash)
2. Reads `pusherConfig.key` and `pusherConfig.cluster` from `@/lib/pusher` (NEXT_PUBLIC_ vars)
3. Subscribes to `private-user-${userId}` channel
4. On `notification` event: calls `queryClient.invalidateQueries(['notifications'])` — triggers refetch
5. Cleans up on unmount: `channel.unbind_all()`, `pusher.disconnect()`

If Pusher env vars are not set (local dev without Pusher account), the hook silently skips — no error.

---

## Vercel Cron — Appointment Reminders

**File**: `src/app/api/cron/appointment-reminders/route.ts`  
**Schedule**: `0 * * * *` (every hour, defined in `vercel.json`)  
**Auth**: `Authorization: Bearer {CRON_SECRET}` header

**Algorithm**:
1. Find appointments where `scheduledAt ∈ [now+24h, now+25h]` and `reminderSentAt: null`
2. For each: send reminder to patient + doctor via `NotificationService`
3. Set `reminderSentAt = now` (idempotency — won't re-send on next cron tick)

**Why `now+24h to now+25h`**: cron runs hourly, so the 1-hour window ensures every appointment in the next 24 hours gets exactly one reminder (unless the cron fires late, in which case no reminder is sent — acceptable for MVP).

---

## `vercel.json` Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

Vercel calls this endpoint with `Authorization: Bearer {CRON_SECRET}` as configured in environment variables.

---

## Known Limitations

- Toast popup on incoming Pusher event is not yet wired (Phase 5.2 note in code) — a `channel.bind('notification', showToast)` call in the `Providers` component would complete this
- Cron reminders have a 1-hour precision — if `scheduledAt` falls outside the hourly window due to cron delay, no reminder is sent
- There is no in-app notification sound — browser `Audio API` or the Notification Web API could be added in Phase 8 polish
