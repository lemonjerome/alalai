'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, Calendar } from 'lucide-react';

interface PreJoinScreenProps {
  patientName: string;
  doctorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  role: 'patient' | 'doctor';
  onJoin: () => void;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Countdown({ scheduledAt }: { scheduledAt: Date }) {
  const [diff, setDiff] = useState(() => scheduledAt.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(scheduledAt.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 1) {
    return (
      <p className="text-sm text-gray-500 text-center">
        Consultation starts in{' '}
        <strong>
          {hours}h {minutes}m
        </strong>
      </p>
    );
  }

  return (
    <p className="text-sm text-amber-600 text-center font-medium">
      Starting in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </p>
  );
}

export function PreJoinScreen({
  patientName,
  doctorName,
  scheduledAt,
  durationMinutes,
  role: _role,
  onJoin,
}: PreJoinScreenProps) {
  // Use useState so the join window is computed once on mount (not re-evaluated during re-renders)
  const [now] = useState(() => Date.now());
  const apptTime = scheduledAt.getTime();
  const isWithinWindow = Math.abs(now - apptTime) <= 15 * 60 * 1000;
  const isTooEarly = now < apptTime - 15 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Participant avatars */}
          <div className="flex justify-center items-center gap-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {initials(patientName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-gray-500 mt-1">{patientName}</p>
            </div>
            <span className="text-2xl text-gray-300">↔</span>
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-lg">
                  {initials(doctorName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-gray-500 mt-1">Dr. {doctorName}</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Consultation Room</h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {scheduledAt.toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {scheduledAt.toLocaleTimeString('en-PH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {durationMinutes} min
              </span>
            </div>
          </div>

          {isTooEarly && <Countdown scheduledAt={scheduledAt} />}

          {!isWithinWindow && !isTooEarly && (
            <p className="text-sm text-gray-500 text-center">
              This consultation has already ended.
            </p>
          )}

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={onJoin}
            disabled={!isWithinWindow}
          >
            <Video className="h-5 w-5" />
            {isWithinWindow ? 'Join Consultation' : 'Session Not Active'}
          </Button>

          {isTooEarly && (
            <p className="text-xs text-gray-400 text-center">
              The Join button activates 15 minutes before your scheduled time.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
