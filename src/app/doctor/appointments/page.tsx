'use client';

import { useDoctorAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarDays } from 'lucide-react';

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="text-base font-medium text-gray-500">{label}</p>
    </div>
  );
}

function DoctorAppointmentTab({ status }: { status?: string }) {
  const { data, isLoading } = useDoctorAppointments({ status });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  const appointments = data?.appointments ?? [];

  if (appointments.length === 0) {
    return <EmptyState label="No appointments found" />;
  }

  return (
    <div className="space-y-3 mt-4">
      {appointments.map((appt) => (
        <AppointmentCard
          key={String(appt._id)}
          appointment={appt}
          counterpartName={appt.patientName ?? undefined}
          role="doctor"
        />
      ))}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage patient consultations</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DoctorAppointmentTab status="pending" />
        </TabsContent>
        <TabsContent value="upcoming">
          <DoctorAppointmentTab status="confirmed" />
        </TabsContent>
        <TabsContent value="completed">
          <DoctorAppointmentTab status="completed" />
        </TabsContent>
        <TabsContent value="cancelled">
          <DoctorAppointmentTab status="cancelled" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
