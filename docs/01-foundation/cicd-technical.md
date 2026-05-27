# CI/CD — Technical Documentation

## GitHub Actions Workflows

### `ci.yml` — Continuous Integration
Triggers on: push to `main`, pull requests to `main`

Steps:
1. `actions/checkout@v4` — check out the repo
2. `actions/setup-node@v4` (Node 20, cache: npm) — installs Node with npm cache
3. `npm ci` — clean install from lockfile (faster and reproducible vs `npm install`)
4. `npm run type-check` — `tsc --noEmit`, fails on any TypeScript error
5. `npm run lint` — Next.js ESLint with project rules
6. `npm run test:coverage` — Jest with coverage threshold enforced (lines ≥ 40% initially, raised to ≥ 60% in Phase 8)

Env vars passed to tests are stubs only — all external services (MongoDB, Pusher, etc.) are mocked in tests.

### `preview.yml` — Vercel Preview Deploy
Triggers on: pull request opened/synchronized

Steps:
1. Install Vercel CLI globally
2. `vercel pull --environment=preview` — downloads `.vercel/` config and preview env vars
3. `vercel build` — builds the project for preview
4. `vercel deploy --prebuilt` — deploys the pre-built output, returns the URL
5. `actions/github-script@v7` — posts the preview URL as a PR comment

### `production.yml` — Vercel Production Deploy
Triggers on: push to `main`

Steps:
1. `vercel pull --environment=production`
2. `vercel build --prod`
3. `vercel deploy --prebuilt --prod`

Note: CI and production deploy run in parallel on push to `main`. The deploy does NOT wait for CI to pass (no `needs:` dependency). For stricter control, add `needs: ci` to the deploy job in `production.yml`.

## Vercel Configuration (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["sin1"],
  "crons": [...]
}
```

- **`regions: ["sin1"]`** — Singapore region. Closest to Philippines for lowest latency. Free tier allows one region only.
- **`crons`** — Vercel's built-in cron job runner. Calls `/api/cron/appointment-reminders` every hour (`0 * * * *`). The API route verifies the `Authorization: Bearer <CRON_SECRET>` header to prevent unauthorized trigger.

## Cron Job Security Pattern
```typescript
const authHeader = req.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
`CRON_SECRET` is set as a Vercel environment variable and is not exposed to the client.

## GitHub Secrets
| Secret | Used By | How to Get |
|---|---|---|
| `VERCEL_TOKEN` | preview.yml, production.yml | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | preview.yml, production.yml | `vercel link` command output |
| `VERCEL_PROJECT_ID` | preview.yml, production.yml | `vercel link` command output |

All other env vars (MONGODB_URI, etc.) are managed exclusively in Vercel's project environment variables, not in GitHub Secrets. This avoids duplication and lets Vercel's preview/production/development scopes control which value is used.

## Coverage Threshold Strategy
- **Phase 1–7**: `lines: 40` — pragmatic threshold while building features
- **Phase 8**: raise to `lines: 60` — enforced before production deploy
- Critical utilities (`src/lib/availability-utils.ts`, `src/lib/validations/`) target 100% coverage explicitly via test completeness (not threshold config)
