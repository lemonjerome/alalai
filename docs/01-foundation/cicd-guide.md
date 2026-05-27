# CI/CD — Developer Guide

## Overview
AlalAI uses GitHub Actions for automated testing and Vercel for deployment. Every push and pull request runs automated checks. Every merge to `main` triggers a production deploy.

## Third-Party Accounts Setup Checklist

Before CI/CD works end-to-end, set up all these services:

| Service | Purpose | URL |
|---|---|---|
| **MongoDB Atlas** | Database | https://cloud.mongodb.com |
| **Vercel** | Hosting + serverless | https://vercel.com |
| **Pusher** | Real-time notifications | https://pusher.com |
| **Cloudinary** | File uploads | https://cloudinary.com |
| **Upstash** | Rate limiting (Redis) | https://upstash.com |

### MongoDB Atlas
1. Create a free M0 cluster
2. Create a database user (Database Access tab)
3. Allow all IPs in Network Access (`0.0.0.0/0`)
4. Get the connection string from Connect → Drivers

### Vercel
1. Create an account and click "Add New Project"
2. Import the `lemonjerome/alalai` GitHub repository
3. Set all environment variables from `.env.example` under Project Settings → Environment Variables
4. Get your Vercel token: Account Settings → Tokens → Create Token
5. Get Org ID and Project ID: `vercel link` in the terminal or from the project URL

### Pusher
1. Create a free account and click "Create app"
2. Choose cluster `ap1` (Asia-Pacific, closest to Philippines)
3. Note your App ID, Key, Secret, and Cluster

### Cloudinary
1. Create a free account
2. From the Dashboard, copy your Cloud Name, API Key, and API Secret

### Upstash
1. Create a free account
2. Create a Redis database (choose Singapore or Tokyo region)
3. Copy the REST URL and REST Token

## GitHub Secrets Required
Add these in your GitHub repo → Settings → Secrets and Variables → Actions:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | From Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | From Vercel project settings or `vercel link` output |
| `VERCEL_PROJECT_ID` | From Vercel project settings or `vercel link` output |

All other secrets (MongoDB URI, Pusher, etc.) are set directly in Vercel environment variables — GitHub CI uses stub values for tests since tests mock these services.

## CI/CD Flow

### On every push to `main`
1. **CI workflow** (`ci.yml`): installs deps → type-checks → lints → runs tests
2. **Production deploy** (`production.yml`): pulls Vercel env → builds → deploys to production URL

### On every pull request
1. **CI workflow**: same checks as above
2. **Preview deploy** (`preview.yml`): deploys to a unique preview URL and posts it as a PR comment

## How to View CI Status
- Go to the GitHub repo → **Actions** tab
- Click any workflow run to see step-by-step logs
- A green checkmark means all checks passed

## How to Check the Deploy
- Production: check Vercel dashboard → your project → Deployments
- Preview: look for the bot comment on the PR with the preview URL

## How to Roll Back a Deployment
1. Go to Vercel dashboard → your project → Deployments
2. Find the last working deployment
3. Click the three-dot menu → **Promote to Production**

## Appointment Reminder Cron Job
The cron job at `/api/cron/appointment-reminders` runs every hour. It:
- Queries appointments scheduled in the next 24 hours
- Sends reminder notifications to both patient and doctor
- Sets `reminderSentAt` to prevent duplicate reminders

Cron jobs only run in production on Vercel. To test locally, call `GET /api/cron/appointment-reminders` with the `Authorization: Bearer <CRON_SECRET>` header.
