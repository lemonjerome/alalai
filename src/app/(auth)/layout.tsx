import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Sign in or create your AlalAI account',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 grid place-items-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
