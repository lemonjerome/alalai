# AlalAI — Telehealth MVP

A patient-doctor consultation booking platform with real-time notifications, virtual video consultations, and medical records management.

**Built for**: Whitecloak Launchpad Builder Round (May 26–30, 2026)  
**Live App**: *(URL to be added after production deployment)*  
**Repo**: https://github.com/lemonjerome/alalai

---

## Features

| Feature | Status |
|---|---|
| Patient & Doctor registration / login | ✅ |
| Doctor profile management & weekly availability | ✅ |
| Doctor discovery with search & specialization filter | ✅ |
| Appointment booking (4-step wizard) | ✅ |
| Appointment reschedule & cancellation | ✅ |
| Doctor must confirm/reject booking & reschedule requests | ✅ |
| Real-time notifications (Pusher) | ✅ |
| 30-min appointment reminders (Vercel Cron) | ✅ |
| Virtual consultation room (Jitsi Meet) | ✅ |
| Doctor consultation notes & prescriptions | ✅ |
| Patient medical records with print support | ✅ |
| AI symptom checker (static, Ollama-ready stub) | ✅ |
| Profile picture upload (Cloudinary) | ✅ |
| Security headers, rate limiting, RBAC | ✅ |

---

## Tech Stack

### Framework & Language

| | |
|---|---|
| **Next.js 15+ (App Router)** | Full-stack React framework. API routes and pages live in the same repo — no separate backend needed. Server Components fetch data directly from MongoDB; Client Components use TanStack Query hooks. The `output: 'standalone'` option produces a self-contained build for Docker. |
| **TypeScript (strict mode)** | All code is fully typed with `strict: true`. No `any` — unknown values are narrowed explicitly. Shared Zod schemas infer TypeScript types so the same validation runs on both server and client. |
| **Tailwind CSS** | Utility-first CSS. Color tokens defined as CSS variables (`--primary`, etc.) so the entire palette can be changed from one place. |
| **shadcn/ui** | Copy-paste component library built on Radix UI primitives. Components live in `src/components/ui/` and are fully customisable. Used for Calendar, Dialog, Tabs, Avatar, Badge, and more. |

### Data & Auth

| | |
|---|---|
| **MongoDB Atlas** | Cloud-hosted MongoDB (free M0 cluster). Stores all application data across 7 collections: `users`, `patient_profiles`, `doctor_profiles`, `availabilities`, `appointments`, `medical_records`, `notifications`. Atlas handles backups, scaling, and network security. |
| **Mongoose** | ODM layer on top of MongoDB. Provides typed schemas, validation, and a singleton connection (`src/lib/db.ts`) that survives Next.js hot-reloads in development. |
| **NextAuth.js v5** | Handles session management with a Credentials provider (email + password). Passwords are hashed with bcrypt (cost 12). On login, a JWT is issued containing `userId`, `role`, and `doctorProfileId` — this is what the middleware and API guards read to enforce role-based access. |
| **Zod** | Runtime schema validation. Every API route validates its request body against a Zod schema before touching the database. The same schemas are imported by React Hook Form on the client for matching client-side validation with no duplication. |
| **TanStack Query v5** | Client-side data fetching and caching. Each domain has a hook file in `src/hooks/` (e.g. `useAppointments`, `useNotifications`). Mutations invalidate the relevant query keys so the UI always reflects the latest server state. |

### External Platforms

| Platform | Free tier used | How it is used in AlalAI |
|---|---|---|
| **MongoDB Atlas** | M0 (512 MB storage) | Primary database. All users, appointments, medical records, and notifications are stored here. The connection string is injected at runtime via `MONGODB_URI`. |
| **Pusher** | Sandbox (200k messages/day, 100 connections) | Real-time notifications. When a booking is made, confirmed, cancelled, or when a medical record is created, the server calls `pusher.trigger('private-user-{userId}', 'notification', payload)`. The browser subscribes to its own private channel via the `/api/pusher/auth` endpoint (which verifies the session before authorising the subscription). The `useNotifications` hook listens for these events and invalidates the notification query cache so the bell badge and list update instantly — no polling. |
| **Cloudinary** | Free (25 credits/month) | Profile picture uploads. When a user uploads a photo, the Next.js API route (`/api/users/me/avatar`) receives the file, passes it to the Cloudinary SDK, and stores the returned CDN URL in the user document. `next/image` is configured to allow `res.cloudinary.com` as a remote pattern so images can be optimised and served at the right size. |
| **Upstash Redis** | Free (10k commands/day) | Rate limiting. `@upstash/ratelimit` runs a sliding-window check on every auth endpoint (5 requests / 10 min / IP) and every booking/record mutation (10 requests / min / user). The Redis client is lazy-initialised — it is only constructed on the first real request, so `next build` never tries to connect. |
| **Jitsi Meet** | Free (meet.jit.si, no account needed) | Video consultations. A deterministic room ID is generated at booking time (`alalai-{appointmentId}`). The consultation page renders a `<iframe src="https://meet.jit.si/{roomId}">` with camera and microphone permissions. No Jitsi account or API key is required — `meet.jit.si` is a publicly available server. The CSP header in `next.config.ts` explicitly allows `frame-src https://meet.jit.si`. |
| **Vercel** | Hobby (free) | Hosting and serverless functions. The Next.js app is deployed as a standalone Node.js server on Vercel's edge infrastructure. Vercel Cron Jobs trigger `/api/cron/appointment-reminders` every hour to send 30-minute-ahead reminders; the endpoint is protected with a `CRON_SECRET` bearer token. Environment variables are managed in the Vercel dashboard — never committed to the repo. |
| **GitHub Actions** | Free (public repo) | CI/CD pipeline. Three workflows: `ci.yml` runs lint + type-check + tests on every PR; `preview.yml` deploys a Vercel preview and posts the URL as a PR comment; `production.yml` deploys to production when `main` is pushed. |

---

## Local Development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas M0 cluster (or local MongoDB)
- Accounts for: Pusher, Cloudinary, Upstash (all have free tiers — links above)

### Setup

```bash
# Clone
git clone https://github.com/lemonjerome/alalai.git
cd alalai

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in all values in .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker (alternative)

```bash
# Build and start with Docker Compose
docker compose up --build

# Stop
docker compose down
```

The Docker image uses a multi-stage build: `deps` → `builder` → `runner`. The final image is ~200 MB and runs `node server.js` (Next.js standalone output).

### Available Scripts

```bash
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run type-check    # TypeScript check (no emit)
npm run test          # Jest tests
npm run test:coverage # Tests with coverage report
```

---

## Environment Variables

Copy `.env.example` and fill in all values:

```
# Auth
NEXTAUTH_URL            # e.g. http://localhost:3000
NEXTAUTH_SECRET         # Random secret: openssl rand -base64 32

# Database
MONGODB_URI             # MongoDB Atlas connection string

# Pusher (real-time notifications)
PUSHER_APP_ID           # Pusher Dashboard → App Keys
PUSHER_KEY
PUSHER_SECRET
PUSHER_CLUSTER          # e.g. ap1
NEXT_PUBLIC_PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER

# Cloudinary (profile picture uploads)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Vercel Cron (appointment reminders)
CRON_SECRET             # Random secret: openssl rand -base64 32
```

> **Tip**: Set `DISABLE_RATE_LIMIT=true` in `.env.local` to skip Upstash during local development if you don't want to set up Redis.

---

## Architecture

```
alalai/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (patient)/       # Patient-facing pages (no URL prefix)
│   │   ├── doctor/          # Doctor-facing pages (/doctor/...)
│   │   ├── consultation/    # Shared Jitsi room
│   │   └── api/             # All API routes
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── appointments/
│   │   ├── consultation/
│   │   ├── doctors/
│   │   ├── layout/
│   │   ├── medical-records/
│   │   ├── notifications/
│   │   └── profile/
│   ├── hooks/               # TanStack Query hooks per domain
│   ├── lib/                 # DB connection, auth, utilities, rate limiting
│   ├── models/              # Mongoose models (7 collections)
│   └── types/               # Shared TypeScript interfaces
├── tests/
│   ├── unit/                # Pure unit tests (no DB)
│   └── integration/         # API integration tests
├── docs/                    # User guides + technical docs per phase
└── .github/workflows/       # CI/CD pipelines
```

### Key Design Decisions

- **Same-origin API** — Next.js API routes live at the same URL as the frontend. No CORS configuration needed; NextAuth session cookies work automatically.
- **JWT sessions (not database sessions)** — Session data is stored in a signed JWT. No extra DB reads on every request; role and userId are read directly from the token.
- **URL search params for filters** — All doctor search filters (specialization, date, keyword) live in the URL. Links are shareable and the browser Back button works correctly.
- **Mongoose singleton** — `src/lib/db.ts` caches the Mongoose connection on the global object to survive Next.js hot-reloads in development and avoid connection pool exhaustion in serverless.
- **Lazy Upstash client** — The Redis client is only instantiated on the first rate-limited request, not at module load. This prevents build-time errors when env vars are absent.

---

## User Flows

### Patient Flow
1. Register as **Patient** → complete health profile
2. Browse **Find Doctors** → filter by specialization or date
3. Or use **Find by Symptoms** → symptom checker → recommended specialization
4. Select a doctor → pick a date and time slot → confirm booking
5. Doctor receives a booking request and must **Accept or Reject**
6. Receive **Appointment Confirmed** notification
7. At appointment time: **Join Session** button activates
8. Jitsi Meet consultation with doctor
9. After session: receive **Medical Record Available** notification
10. View record, prescriptions, and follow-up date in **Medical Records**

### Doctor Flow
1. Register as **Doctor** → complete profile (specialization, bio, education, fee)
2. Set weekly availability slots in **My Profile**
3. Receive **Booking Request** notification when patient books → **Accept or Reject**
4. Rescheduled appointments also require re-confirmation
5. View schedule in **Appointments**
6. **Join Session** at appointment time
7. Post-session: create consultation notes + prescriptions in **Records**
8. Patient receives notification; record is editable for 72 h then locks

---

## API Reference

See [docs/README.md](docs/README.md) for the full API route reference.

Health check: `GET /api/health` → `{ status: 'ok', timestamp }`

---

## Documentation

Full user guides and technical docs are in [docs/](docs/):

- [Project Setup](docs/01-foundation/project-setup-guide.md)
- [Authentication](docs/02-auth/authentication-guide.md)
- [Doctor Profile & Discovery](docs/03-doctor-profile/doctor-discovery-guide.md)
- [Appointment Booking](docs/04-appointments/appointment-booking-guide.md)
- [Notifications](docs/05-notifications/notifications-guide.md)
- [Consultation Room](docs/06-consultation/consultation-guide.md)
- [Medical Records](docs/07-medical-records/medical-records-doctor-guide.md)
- [Security](docs/08-ai-placeholder/security-guide.md)

---

## CI/CD

- **CI** (`ci.yml`): runs on every PR → lint + type-check + tests
- **Preview** (`preview.yml`): Vercel preview deploy → posts URL as PR comment
- **Production** (`production.yml`): deploys `main` branch to Vercel on push

> **Note on Docker builds**: `typescript.ignoreBuildErrors` and `experimental.cpus: 2` are set in `next.config.ts` to prevent OOM kills inside Docker Desktop's constrained memory environment. Type-checking still runs in CI via `npm run type-check`.

---

## License

MIT — see LICENSE file.
