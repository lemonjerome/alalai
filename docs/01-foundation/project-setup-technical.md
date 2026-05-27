# Project Setup — Technical Documentation

## Architecture Decision: Next.js Full-Stack Monorepo

AlalAI uses a single Next.js 14 App Router project for both frontend and backend. This means:
- **API routes** (`src/app/api/`) run as Vercel serverless functions
- **Pages** (`src/app/(patient)/`, `src/app/(doctor)/`) are React Server Components by default
- **One Vercel deployment** handles everything — no separate frontend/backend deploys, no CORS

**Trade-off**: Frontend and backend cannot scale independently. Acceptable for MVP scope.

## Why These Choices

| Choice | Reason |
|---|---|
| Next.js 14 App Router | Latest stable; RSC reduces client JS; file-based routing matches the spec's modular structure |
| TypeScript strict | Catches runtime bugs at compile time; required by spec |
| Tailwind CSS v4 | Utility-first, no CSS file bloat, fast iteration |
| ESLint + Prettier | Consistent code style enforced automatically |
| Jest (ts-jest) | Native TypeScript support; split node/jsdom environments |

## TypeScript Configuration Notes
- `strict: true` — enables `strictNullChecks`, `noImplicitAny`, etc.
- `forceConsistentCasingInFileNames: true` — prevents issues on case-insensitive macOS/Windows when deploying to Linux
- Path aliases: `@/*` maps to `src/*`, plus explicit aliases for `models`, `lib`, `types`, `components`, `hooks`
- `tests/` is excluded from `tsconfig.json` — Jest uses its own `ts-jest` transform with `module: commonjs` for the integration project

## Jest Configuration
Two Jest projects configured in `jest.config.ts`:

**`unit`** — `testEnvironment: 'jsdom'`
- For React component tests and pure utility tests
- Tests in `tests/unit/`
- Uses `@testing-library/react` + `@testing-library/jest-dom`

**`integration`** — `testEnvironment: 'node'`
- For API route tests using `supertest`
- Tests in `tests/integration/`
- Uses `module: commonjs` so `require()` and Node APIs work correctly

## ESLint Rules Rationale
- `@typescript-eslint/no-explicit-any: error` — enforces the "no any" rule from CLAUDE.md
- `@typescript-eslint/no-unused-vars: error` — catch dead code early; underscore prefix exempted for intentional ignores (e.g., `_req`)
- `no-console: warn` — allows `console.error` and `console.warn` for error reporting, disallows `console.log` debug statements in production code

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.x | Framework |
| `next-auth` | 5.0-beta | Authentication (JWT sessions) |
| `mongoose` | 9.x | MongoDB ODM with TypeScript support |
| `zod` | 4.x | Runtime validation + TypeScript type inference |
| `@tanstack/react-query` | 5.x | Client-side data fetching, caching, mutations |
| `pusher` | 5.x | Server-side Pusher trigger |
| `pusher-js` | 8.x | Client-side Pusher subscription |
| `cloudinary` | 2.x | File uploads (profile pictures) |
| `@upstash/ratelimit` | 2.x | Serverless-compatible rate limiting |
| `@upstash/redis` | 1.x | Redis client for Upstash (HTTP-based, works on Vercel) |
| `bcryptjs` | 3.x | Password hashing (pure JS, no native bindings) |
| `react-hook-form` | 7.x | Performant form state management |
| `@hookform/resolvers` | 5.x | Zod resolver for react-hook-form |

## Environment Variables
All variables defined in `.env.example`. `.env.local` is gitignored. In Vercel, set via dashboard under Project Settings → Environment Variables.

`NEXT_PUBLIC_*` prefixed variables are exposed to the browser bundle — only use for non-secret values (Pusher public key, cluster).

## Scripts
- `type-check` runs `tsc --noEmit` — checks types without emitting files; faster than a full build
- `lint:fix` chains `next lint --fix` with `prettier --write .` — single command for all code style fixes
- `test:unit` / `test:integration` use Jest `--selectProjects` flag to run only the matching project
