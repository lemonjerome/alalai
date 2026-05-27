import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function DoctorLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'doctor') {
    redirect('/patient/dashboard');
  }

  return <>{children}</>;
}
