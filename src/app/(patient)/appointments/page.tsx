'use client';

import { useMyAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="text-base font-medium text-gray-500">{label}</p>
    </div>
  );
}

function AppointmentTab({ status }: { status?: string }) {
  const { data, isLoading } = useMyAppointments(status);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const appointments = data?.appointments ?? [];

  if (appointments.length === 0) {
    return <EmptyState label={status === 'cancelled' ? 'No cancelled appointments' : 'No appointments found'} />;
  }

  return (
    <div className="space-y-3 mt-4">
      {appointments.map((appt) => (
        <AppointmentCard
          key={String(appt._id)}
          appointment={appt}
          counterpartName={appt.doctorName ?? undefined}
          role="patient"
        />
      ))}
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your consultations</p>
        </div>
        <Link href="/doctors" className={buttonVariants({ variant: 'default', size: 'sm' })}>
          + Book New
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <AppointmentTab />
        </TabsContent>
        <TabsContent value="completed">
          <AppointmentTab status="completed" />
        </TabsContent>
        <TabsContent value="cancelled">
          <AppointmentTab status="cancelled" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
