# CI/CD & Infrastructure Setup — User Guide

## Overview
AlalAI uses GitHub Actions for CI/CD, Vercel for hosting, and MongoDB Atlas for the database. This guide walks through setting up all required accounts and secrets from scratch.

---

## 1. MongoDB Atlas (Free M0 Cluster)

### Create your cluster
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign up (free).
2. Click **"Build a Database"** → choose **"M0 Free"** tier.
3. Provider: AWS, Region: **Southeast Asia (Singapore)** — closest to PH users.
4. Cluster Name: `alalai` → click **"Create Deployment"**.

### Create a database user
1. In the left sidebar → **Database Access** → **Add New Database User**.
2. Authentication: Username/Password.
3. Username: `alalai-app`, Password: generate a secure one (copy it).
4. Database User Privileges: **Read and Write to Any Database** → **Add User**.

### Allow network access
1. Left sidebar → **Network Access** → **Add IP Address**.
2. Click **"Allow Access from Anywhere"** (0.0.0.0/0).
   - Note: Atlas credentials are the security layer — this is standard for serverless deployments.
3. Click **Confirm**.

### Get your connection string
1. Left sidebar → **Database** → **Connect** → **Drivers** → **Node.js**.
2. Copy the URI. It looks like:
   ```
   mongodb+srv://alalai-app:<password>@alalai.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with the password you created above.
4. Append the database name before `?`:
   ```
   mongodb+srv://alalai-app:<password>@alalai.xxxxx.mongodb.net/alalai?retryWrites=true&w=majority
   ```

### Save the connection string
Add it to your `.env.local`:
```
MONGODB_URI=mongodb+srv://alalai-app:<password>@alalai.xxxxx.mongodb.net/alalai?retryWrites=true&w=majority
```

---

## 2. Vercel Project Setup

### Create a Vercel account and link your repo
1. Go to [vercel.com](https://vercel.com) → sign up with GitHub.
2. Click **"Add New Project"** → import `lemonjerome/alalai` from GitHub.
3. Framework Preset: **Next.js** (auto-detected).
4. Root Directory: `.` (the repo root).
5. Click **"Deploy"** — the first deploy will fail (no env vars yet) — that's OK.

### Get your Vercel credentials for GitHub Actions
You need three values: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

**VERCEL_TOKEN:**
1. Vercel Dashboard → top-right avatar → **Settings** → **Tokens**.
2. Create token: Name = `github-actions`, Scope = **Full Account**, No Expiry.
3. Copy the token (shown once).

**VERCEL_ORG_ID and VERCEL_PROJECT_ID:**
```bash
npx vercel link   # follow prompts, link to your project
cat .vercel/project.json
```
This prints:
```json
{ "orgId": "team_xxxxx", "projectId": "prj_xxxxx" }
```
`orgId` = `VERCEL_ORG_ID`, `projectId` = `VERCEL_PROJECT_ID`.

### Add GitHub secrets
1. GitHub → `lemonjerome/alalai` → **Settings** → **Secrets and variables** → **Actions**.
2. Add each secret with **"New repository secret"**:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |
| `MONGODB_URI` | Your Atlas connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel production URL (e.g. `https://alalai.vercel.app`) |

### Add environment variables in Vercel dashboard
1. Vercel Dashboard → your project → **Settings** → **Environment Variables**.
2. Add all variables from `.env.example` for the **Production** environment.
3. For preview deploys, the same vars should cover the **Preview** environment.

---

## 3. Other Services (Pusher, Cloudinary, Upstash)

### Pusher (real-time notifications)
1. [pusher.com](https://pusher.com) → sign up → **"Create app"**.
2. Name: `alalai`, Cluster: **ap1 (Singapore)**.
3. From the app dashboard, copy: App ID, Key, Secret, Cluster.
4. Add to GitHub secrets: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.

### Cloudinary (profile pictures)
1. [cloudinary.com](https://cloudinary.com) → sign up.
2. Dashboard shows your Cloud Name, API Key, API Secret.
3. Add to secrets: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Upstash Redis (rate limiting)
1. [console.upstash.com](https://console.upstash.com) → sign up → **"Create database"**.
2. Name: `alalai-ratelimit`, Region: **Singapore**, Type: **Regional**.
3. Copy **REST URL** and **REST Token**.
4. Add to secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

---

## 4. CI/CD Workflow Overview

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every push + PR to `main` | Lint → type-check → tests with coverage |
| `preview.yml` | PR opened/updated | Deploys a preview to Vercel, posts URL as PR comment |
| `production.yml` | Push to `main` | Deploys to Vercel production (skips gracefully if `VERCEL_TOKEN` not set) |

### Checking CI status
- Go to GitHub → **Actions** tab to see all runs.
- A green ✅ on a commit means lint, type-check, and tests all passed.
- The PR preview URL is posted as a comment on the pull request automatically.

### Rolling back a deployment
1. Vercel Dashboard → **Deployments** tab.
2. Find the last known-good deployment → **⋮** → **Promote to Production**.

---

## 5. Local Development with Docker

Docker lets you run the full stack locally without needing cloud accounts.

### Prerequisites
- Docker Desktop installed ([docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop))

### Start the local stack
```bash
# Build and start MongoDB + app
docker compose up -d

# Check logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and delete all data (wipe DB)
docker compose down -v
```

The app runs at **http://localhost:3000**.
MongoDB is available at `mongodb://alalai:alalai_dev@localhost:27017/alalai_local?authSource=admin`.

### What works locally with Docker
| Feature | Works | Notes |
|---|---|---|
| Login / Register | ✅ | Full functionality |
| Doctor / Patient profiles | ✅ | Full functionality |
| Appointments | ✅ | Full functionality |
| Medical records | ✅ | Full functionality |
| Rate limiting | ✅ | Disabled via `DISABLE_RATE_LIMIT=true` |
| Real-time notifications | ⚠️ | Needs real Pusher credentials in docker-compose.yml |
| Avatar uploads | ⚠️ | Needs real Cloudinary credentials in docker-compose.yml |
| Jitsi video | ✅ | Uses public `meet.jit.si` — no account needed |

### Development mode (hot reload)
For active development, running locally with `npm run dev` is faster than Docker:
```bash
cp .env.example .env.local
# Fill in .env.local with your credentials
npm install
npm run dev
```

---

## 6. Node.js Version Notice in CI

The CI runs on Node.js 24. You may see a warning:
> "Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24"

This is expected — the `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` environment variable in all workflows correctly forces GitHub's action runners to Node.js 24. The warning is informational only and does not indicate a problem.
