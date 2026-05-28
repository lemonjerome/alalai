# Consultation Session — Technical Documentation

## Architecture

The consultation room is split across three files:

```
src/app/consultation/[appointmentId]/
├── page.tsx              — Server Component: auth, ownership, data fetch
└── ConsultationClient.tsx — Client Component: pre-join → Jitsi state machine
src/components/consultation/
├── PreJoinScreen.tsx     — Pre-join UI with countdown timer
└── JitsiFrame.tsx        — <iframe> wrapper for meet.jit.si
```

---

## Server Component (`page.tsx`)

Runs on every request:
1. Validates `appointmentId` as a MongoDB ObjectId
2. Calls `auth()` — redirects to `/login` if no session
3. Fetches `Appointment` + both `User` records from DB
4. Ownership check: `patientId === userId || doctorId === userId` — redirects if neither
5. Blocks cancelled appointments (redirects to appointments list)
6. Passes `scheduledAt` (ISO string), `jitsiRoomId`, names, role, currentUserName as props to `ConsultationClient`

---

## `ConsultationClient` (`ConsultationClient.tsx`)

Client Component managing two states: `joined = false` (pre-join) → `joined = true` (Jitsi).

On `onJoin()`: sets `joined = true`, `PreJoinScreen` is unmounted, `JitsiFrame` mounts. No page navigation.

---

## `JitsiFrame` (`src/components/consultation/JitsiFrame.tsx`)

```tsx
<iframe
  src={`https://meet.jit.si/${roomId}#config.startWithAudioMuted=false&...`}
  allow="camera; microphone; fullscreen; display-capture; autoplay"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
  className="w-full h-full rounded-lg border-0"
/>
```

**Room ID generation**: `alalai-${appointmentId._id.toString()}` — deterministic, created at booking time and stored in `Appointment.jitsiRoomId`.

**Config params passed via hash fragment** (Jitsi reads these from `window.location.hash`):
- `config.startWithAudioMuted=false` — mic on by default
- `config.prejoinPageEnabled=false` — skips Jitsi's own pre-join page (we have our own)
- `userInfo.displayName={currentUserName}` — sets the participant's display name in Jitsi

---

## `PreJoinScreen` (`src/components/consultation/PreJoinScreen.tsx`)

Client Component. Manages a countdown timer via `setInterval` (1s updates).

**Join window check**:
```ts
const isWithinWindow = Math.abs(Date.now() - scheduledAt.getTime()) <= 15 * 60 * 1000;
```
The `Join Consultation` button is `disabled={!isWithinWindow}`.

States:
- `isTooEarly` (> 15min before) → shows countdown + disabled button
- `isWithinWindow` → shows enabled button
- Past window → shows "Session has ended" + disabled button

---

## CSP Configuration

**`next.config.ts`** must allow Jitsi in the Content Security Policy:
```
frame-src 'self' https://meet.jit.si
```
Without this, the browser blocks the iframe. The security headers in Phase 8.1 include this allow-list.

---

## Why Jitsi Meet (not custom WebRTC)?

- **Zero cost**: `meet.jit.si` is a public Jitsi instance with no usage limits for basic calls
- **No account**: patients and doctors join with just a URL — no registration needed on their end
- **Browser-native**: works in any modern browser without plugins
- **Deterministic rooms**: rooms are identified by name (`alalai-{appointmentId}`) — predictable, linkable, no server state needed
- **Trade-offs**: room names are guessable if someone has the appointment ID; for production with sensitive medical conversations, a self-hosted Jitsi instance or a service like Daily.co would be preferable

---

## Security Notes

- **Ownership check** on the server: only the patient or doctor of the appointment can access `/consultation/[appointmentId]` — if they're not an owner, they're redirected
- **Cancelled appointments** redirect immediately — no room is accessible for cancelled sessions
- **Display name** is injected from the session name — not user-controlled in the URL
- **Room name security**: the room `alalai-{appointmentId}` is long enough to be unguessable (ObjectId = 24 hex chars), but anyone who obtains the appointmentId could construct the room URL and join via `meet.jit.si` directly. This is acceptable for the MVP; a private Jitsi deployment with token-authenticated rooms would address this.

---

## Known Limitations

- `ConsultationSidebar` (for doctor to add notes during the session) was deferred — doctors add notes via the Records page after the session
- No recording functionality — Jitsi supports recording to Dropbox but this is not wired
- No session expiry enforcement — Jitsi room stays accessible to anyone with the URL; the ±15 min gate is UI-only (server page load checks it, but a direct iframe URL would bypass it)
