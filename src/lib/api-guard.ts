import { auth } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  session: {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      doctorProfileId?: string;
    };
  };
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  /** If provided, only these roles may call the route. */
  roles?: UserRole[];
}

/**
 * Higher-order function that wraps a Next.js App Router route handler
 * with session verification and optional role enforcement.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req) => {
 *   const { id, role } = req.session.user;
 *   // ...
 * }, { roles: ['doctor'] });
 * ```
 */
export function withAuth(handler: RouteHandler, options: WithAuthOptions = {}): RouteHandler {
  return async function (req, context) {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (options.roles && !options.roles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Attach session to request object for convenience
    (req as AuthenticatedRequest).session = {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        role: session.user.role as UserRole,
        doctorProfileId: session.user.doctorProfileId,
      },
    };

    return handler(req as AuthenticatedRequest, context);
  };
}
