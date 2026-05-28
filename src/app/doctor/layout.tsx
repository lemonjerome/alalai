import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DoctorNav } from '@/components/layout/DoctorNav';

export default async function DoctorLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'doctor') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r flex-col">
        <DoctorNav />
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
