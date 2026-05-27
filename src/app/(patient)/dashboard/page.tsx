import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patient Dashboard',
};

// Full dashboard implemented in Phase 3.4
export default function PatientDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Patient Dashboard</h1>
      <p className="text-muted-foreground mt-2">Your health overview — coming soon.</p>
    </div>
  );
}
