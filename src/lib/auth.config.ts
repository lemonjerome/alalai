/**
 * Edge-compatible NextAuth configuration.
 *
 * This file must NOT import any Node.js-only modules (mongoose, bcrypt, etc.)
 * because it is imported by the proxy (middleware) which runs in the Edge runtime.
 *
 * Node.js-specific providers (Credentials + DB calls) are added in auth.ts,
 * which is only used by API routes (Node.js runtime).
 */

import type { NextAuthConfig, DefaultSession } from 'next-auth';
import type { UserRole } from '@/types';

// Extend NextAuth types — declared here so both auth.config.ts and auth.ts share them
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      doctorProfileId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    doctorProfileId?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    doctorProfileId?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [], // Credentials provider added in auth.ts (Node.js only)

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role as UserRole;
        token.doctorProfileId = user.doctorProfileId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.doctorProfileId = token.doctorProfileId as string | undefined;
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
