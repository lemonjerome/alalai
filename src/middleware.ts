import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register'];
// API routes handled by NextAuth itself
const AUTH_API_PREFIX = '/api/auth';

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes and NextAuth API routes
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // Allow public API routes (health check)
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // Unauthenticated users → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  // Prevent patients from accessing doctor routes
  if (pathname.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/patient/dashboard', req.url));
  }

  // Prevent doctors from accessing patient routes
  if (pathname.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
  }

  // Prevent wrong roles from accessing role-specific API routes
  if (pathname.startsWith('/api/doctors/me') && role !== 'doctor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
