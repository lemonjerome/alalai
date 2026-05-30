/**
 * Next.js 16 proxy (Edge runtime).
 *
 * Must NOT import NextAuth() — even with an empty providers config, calling
 * NextAuth() pulls in the full next-auth bundle which depends on Node.js
 * 'stream' and crashes in the Edge runtime.
 *
 * Instead we use `getToken` from `next-auth/jwt` which only relies on `jose`
 * (Edge-compatible) to verify the encrypted JWT cookie.
 */

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);
const AUTH_API_PREFIX = '/api/auth';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public pages and NextAuth API routes — always allow
  if (PUBLIC_ROUTES.has(pathname) || pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // Health check — no auth required
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // Verify JWT cookie (uses jose — Edge-safe, no Node.js APIs)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Unauthenticated → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string | undefined;

  // Prevent patients from accessing doctor routes (/doctor/... but NOT /doctors/...)
  if ((pathname === '/doctor' || pathname.startsWith('/doctor/')) && role !== 'doctor') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Prevent doctors from accessing patient routes (/patient/... — no such routes currently, but guard anyway)
  if (pathname.startsWith('/patient/') && role !== 'patient') {
    return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
  }

  // Block wrong-role access to doctor-only API routes
  if (pathname.startsWith('/api/doctors/me') && role !== 'doctor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
