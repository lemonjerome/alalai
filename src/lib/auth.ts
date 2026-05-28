import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import { authConfig } from '@/lib/auth.config';
import type { UserRole } from '@/types';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        const user = await User.findOne({ email }).select('+passwordHash').lean();
        if (!user) return null;

        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

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
          role: user.role as UserRole,
          doctorProfileId,
        };
      },
    }),
  ],
});
