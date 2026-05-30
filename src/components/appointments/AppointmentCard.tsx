'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { CancelDialog } from '@/components/appointments/CancelDialog';
import { RescheduleDialog } from '@/components/appointments/RescheduleDialog';
import { Clock, Video, X, CheckCircle2, CalendarDays } from 'lucide-react';
import { useCancelAppointment, useCompleteAppointment, useRescheduleAppointment } from '@/hooks/useAppointments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AppointmentWithId } from '@/hooks/useAppointments';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-orange-100 text-orange-700',
};

interface AppointmentCardProps {
  appointment: AppointmentWithId;
  counterpartName?: string;   // doctor name (for patient) or patient name (for doctor)
  role: 'patient' | 'doctor';
}

/** Returns true if the current time is within ±15 minutes of scheduledAt */
function canJoin(scheduledAt: Date): boolean {
  const now = Date.now();
  const apptTime = scheduledAt.getTime();
  return Math.abs(now - apptTime) <= 15 * 60 * 1000;
}

export function AppointmentCard({ appointment, counterpartName, role }: AppointmentCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const scheduledAt = new Date(appointment.scheduledAt);
  const joinable = canJoin(scheduledAt) && appointment.status === 'confirmed';
  const isActive = ['pending', 'confirmed'].includes(appointment.status);

  const handleReschedule = (scheduledAt: string) => {
    rescheduleMutation.mutate(
      { id: String(appointment._id), scheduledAt, durationMinutes: appointment.durationMinutes },
      {
        onSuccess: () => {
          toast.success('Appointment rescheduled');
          setRescheduleOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleCancel = (reason: string) => {
    cancelMutation.mutate(
      { id: String(appointment._id), reason },
      {
        onSuccess: () => {
          toast.success('Appointment cancelled');
          setCancelOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleComplete = () => {
    completeMutation.mutate(String(appointment._id), {
      onSuccess: () => toast.success('Appointment marked as completed'),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <>
      <Card className={cn('transition-shadow hover:shadow-sm', !isActive && 'opacity-70')}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={cn('text-xs', STATUS_COLORS[appointment.status])}>
                  {appointment.status}
                </Badge>
              </div>
              <p className="font-medium text-gray-900">
                {role === 'patient' ? 'Dr. ' : ''}{counterpartName ?? 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5" />
                {scheduledAt.toLocaleDateString('en-PH', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {scheduledAt.toLocaleTimeString('en-PH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {appointment.durationMinutes} min
              </p>
              {appointment.cancellationReason && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  Reason: {appointment.cancellationReason}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              {/* Join button */}
              {appointment.status === 'confirmed' && (
                <Link
                  href={`/consultation/${String(appointment._id)}`}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'gap-1',
                    !joinable && 'pointer-events-none opacity-50'
                  )}
                  aria-disabled={!joinable}
                  title={joinable ? 'Join session' : 'Available ±15 min from scheduled time'}
                >
                  <Video className="h-3.5 w-3.5" />
                  Join
                </Link>
              )}

              {/* Doctor: mark complete */}
              {role === 'doctor' && appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete
                </Button>
              )}

              {/* Patient: reschedule */}
              {role === 'patient' && isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setRescheduleOpen(true)}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Reschedule
                </Button>
              )}

              {/* Cancel */}
              {isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancel}
        isPending={cancelMutation.isPending}
      />

      {role === 'patient' && (
        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          appointmentId={String(appointment._id)}
          doctorId={String(appointment.doctorId)}
          durationMinutes={appointment.durationMinutes}
          isPending={rescheduleMutation.isPending}
          onConfirm={handleReschedule}
        />
      )}
    </>
  );
}
