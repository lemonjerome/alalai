import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect patient dashboard routes
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.url));
  }

  // Protect doctor routes
  if (pathname.startsWith('/doctor') && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.url));
  }

  // Protect consultation routes
  if (pathname.startsWith('/consultation') && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.url));
  }

  // Redirect already-logged-in users away from login/register
  if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
    const role = req.auth?.user?.role;
    const dest = role === 'doctor' ? '/doctor/dashboard' : '/dashboard';
    return Response.redirect(new URL(dest, req.url));
  }
});

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
