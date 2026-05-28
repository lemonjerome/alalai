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

/** Handler type used inside withAuth — receives the augmented request with session. */
type InnerHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Handler type returned by withAuth — accepts a plain NextRequest so that
 * Next.js's route-handler type checker is satisfied when the result is
 * exported directly as GET / POST / PATCH / DELETE.
 */
type OuterHandler = (
  req: NextRequest,
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
export function withAuth(handler: InnerHandler, options: WithAuthOptions = {}): OuterHandler {
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
