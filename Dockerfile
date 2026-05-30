# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

# Install only production-affecting deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time env stubs (real values injected at runtime via env vars)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-placeholder
# Prevent OOM: cap each Node worker heap to 512 MB
# (experimental.cpus in next.config.ts limits workers to 2, so peak = 2 × 512 MB)
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only the built output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
