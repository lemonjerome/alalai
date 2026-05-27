# Project Setup — Developer Guide

## What is this?
AlalAI is a telehealth web application that lets patients book consultations with doctors, join virtual sessions, and view their medical records. This document explains how to get the project running on your local machine.

## Prerequisites
- Node.js 20+ (use `node -v` to check)
- npm 9+
- Git
- A MongoDB Atlas account (free M0 tier)
- A Vercel account (for deployment)
- A Pusher account (for real-time notifications)
- A Cloudinary account (for profile pictures)
- An Upstash account (for rate limiting)

## First-Time Setup

### 1. Clone the repository
```bash
git clone git@github.com:lemonjerome/alalai.git
cd alalai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy `.env.example` to `.env.local` and fill in each value:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- Pusher credentials from your Pusher dashboard
- Cloudinary credentials from your Cloudinary dashboard
- Upstash Redis REST URL and token from your Upstash console
- `CRON_SECRET` — any random secret string

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Check for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint and Prettier issues |
| `npm run type-check` | Check TypeScript types without building |
| `npm run format` | Format all files with Prettier |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure
```
alalai/
├── src/
│   ├── app/             # Next.js App Router — pages and API routes
│   │   ├── (auth)/      # Login and registration pages
│   │   ├── (patient)/   # Patient-facing pages
│   │   ├── (doctor)/    # Doctor-facing pages
│   │   ├── consultation/# Shared consultation room
│   │   └── api/         # REST API routes
│   ├── components/      # Reusable React components
│   ├── hooks/           # TanStack Query hooks
│   ├── lib/             # Utilities (DB, auth, Pusher, etc.)
│   ├── models/          # Mongoose database models
│   └── types/           # Shared TypeScript types
├── tests/
│   ├── unit/            # Component and utility tests
│   └── integration/     # API route tests
├── docs/                # Project documentation (this folder)
├── .env.example         # Environment variable template
└── CLAUDE.md            # AI assistant rules (local only, not committed)
```

## Contributing Conventions
- Commit format: `<type>(<scope>): <description> [Phase X.Y]`
- Every new feature must produce two docs files in `docs/`
- Run `npm run type-check && npm run lint` before committing
- Never commit `.env.local` or any file containing real credentials
