import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import type { UserRole } from '@/types';

// Extend NextAuth types to include custom fields
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

// In next-auth v5 (auth.js), JWT augmentation targets @auth/core/jwt
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    doctorProfileId?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await connectDB();

        // Explicitly select passwordHash since it has select: false
        const user = await User.findOne({ email }).select('+passwordHash').lean();
        if (!user) return null;

        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Build doctorProfileId if applicable
        let doctorProfileId: string | undefined;
        if (user.role === 'doctor') {
          const DoctorProfile = (await import('@/models/DoctorProfile')).default;
          const profile = await DoctorProfile.findOne({ userId: user._id })
            .select('_id')
            .lean();
          if (profile) {
            doctorProfileId = (profile._id as mongoose.Types.ObjectId).toString();
          }
        }

        return {
          id: (user._id as mongoose.Types.ObjectId).toString(),
          email: user.email,
          name: user.name,
          image: user.profilePictureUrl ?? null,
          role: user.role,
          doctorProfileId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: persist custom fields into JWT
        token.id = user.id!;
        token.role = user.role;
        token.doctorProfileId = user.doctorProfileId;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose custom fields to the client session
      // Cast needed: despite module augmentation, token is still typed as JWT & Record<string,unknown>
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.doctorProfileId = token.doctorProfileId as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
