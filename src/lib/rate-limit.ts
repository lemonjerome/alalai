import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';

// Lazy-initialised Redis client (avoids errors at build time when env vars are absent)
function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Auth endpoints: 5 requests per 10 minutes per IP
const authLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: false,
  prefix: 'ratelimit:auth',
});

// Mutation endpoints (booking, records): 10 requests per minute per user
const mutationLimiter = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: false,
  prefix: 'ratelimit:mutation',
});

/**
 * Apply auth rate limiting (5 req / 10 min / IP).
 * Returns a 429 NextResponse if the limit is exceeded, or null if the request is allowed.
 */
export async function rateLimit(
  req: NextRequest,
  type: 'auth' | 'mutation' = 'auth',
  identifier?: string
): Promise<NextResponse | null> {
  // Skip in test environments or when explicitly disabled (e.g. local Docker)
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') return null;

  const limiter = type === 'auth' ? authLimiter : mutationLimiter;
  const key = identifier ?? (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous');

  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
