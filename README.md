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
| Real-time notifications (Pusher) | ✅ |
| 24h appointment reminders (Vercel Cron) | ✅ |
| Virtual consultation room (Jitsi Meet) | ✅ |
| Doctor consultation notes & prescriptions | ✅ |
| Patient medical records with print support | ✅ |
| AI symptom checker (static, Ollama-ready stub) | ✅ |
| Profile picture upload (Cloudinary) | ✅ |
| Security headers, rate limiting, RBAC | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript strict mode |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js v5 (JWT credentials) |
| UI | shadcn/ui + Tailwind CSS |
| Data fetching | TanStack Query v5 |
| Real-time | Pusher (private channels) |
| Video | Jitsi Meet (`meet.jit.si` iframe) |
| File uploads | Cloudinary |
| Rate limiting | Upstash Redis |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## Local Development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas M0 cluster (or local MongoDB)
- Accounts for: Pusher, Cloudinary, Upstash

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

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript check (no emit)
npm run test         # Jest tests
npm run test:coverage # Tests with coverage report
```

---

## Environment Variables

Copy `.env.example` and fill in all values:

```
NEXTAUTH_URL            # e.g. http://localhost:3000
NEXTAUTH_SECRET         # Random secret (openssl rand -base64 32)
MONGODB_URI             # MongoDB Atlas connection string
PUSHER_APP_ID           # Pusher Dashboard → App Keys
PUSHER_KEY
PUSHER_SECRET
PUSHER_CLUSTER          # e.g. ap1
NEXT_PUBLIC_PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
CRON_SECRET             # Random secret for cron endpoint auth
```

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
│   ├── lib/                 # DB connection, auth, utilities
│   ├── models/              # Mongoose models (7 collections)
│   └── types/               # Shared TypeScript interfaces
├── tests/
│   ├── unit/                # Pure unit tests (no DB)
│   └── integration/         # API integration tests
├── docs/                    # User guides + technical docs per phase
└── .github/workflows/       # CI/CD pipelines
```

---

## User Flows

### Patient Flow
1. Register as **Patient** → complete health profile
2. Browse **Find Doctors** → filter by specialization or date
3. Or use **Find by Symptoms** → symptom checker → recommended specialization
4. Select a doctor → pick a date and time slot → confirm booking
5. Receive **Appointment Confirmed** notification
6. At appointment time: **Join Session** button activates (±15 min window)
7. Jitsi Meet consultation with doctor
8. After session: receive **Medical Record Available** notification
9. View record, prescriptions, and follow-up date in **Medical Records**

### Doctor Flow
1. Register as **Doctor** → complete profile (specialization, bio, education, fee)
2. Set weekly availability slots in **My Profile**
3. Receive **New Appointment** notification when patient books
4. View schedule in **Appointments**
5. **Join Session** at appointment time
6. Post-session: create consultation notes + prescriptions in **Records**
7. Patient receives notification; record is editable for 72h then locks

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
- **Production** (`production.yml`): deploys main branch to Vercel on push

---

## License

MIT — see LICENSE file.
