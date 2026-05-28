import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { PatientNav } from '@/components/layout/PatientNav';

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'patient') {
    redirect('/doctor/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r flex-col">
        <PatientNav />
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
