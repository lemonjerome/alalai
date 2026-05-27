import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Doctor Dashboard',
};

// Full dashboard implemented in Phase 3.4
export default function DoctorDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
      <p className="text-muted-foreground mt-2">Your schedule overview — coming soon.</p>
    </div>
  );
}
