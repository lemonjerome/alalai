import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';

// Truly lazy limiters — only instantiated on first actual request, not at module load.
// This prevents Upstash warnings during `next build` when env vars are absent.
let _authLimiter: Ratelimit | null = null;
let _mutationLimiter: Ratelimit | null = null;

function getAuthLimiter(): Ratelimit {
  if (!_authLimiter) {
    _authLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: false,
      prefix: 'ratelimit:auth',
    });
  }
  return _authLimiter;
}

function getMutationLimiter(): Ratelimit {
  if (!_mutationLimiter) {
    _mutationLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: false,
      prefix: 'ratelimit:mutation',
    });
  }
  return _mutationLimiter;
}

/**
 * Apply rate limiting.
 * - auth:     5 req / 10 min / IP
 * - mutation: 10 req / min / user
 *
 * Returns a 429 NextResponse if the limit is exceeded, or null if allowed.
 */
export async function rateLimit(
  req: NextRequest,
  type: 'auth' | 'mutation' = 'auth',
  identifier?: string
): Promise<NextResponse | null> {
  // Skip in test environments or when explicitly disabled (e.g. local Docker without Upstash)
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') return null;

  const limiter = type === 'auth' ? getAuthLimiter() : getMutationLimiter();
  const key =
    identifier ??
    (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous');

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
