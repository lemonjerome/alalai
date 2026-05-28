'use client';

import { useState } from 'react';
import { PreJoinScreen } from '@/components/consultation/PreJoinScreen';
import { JitsiFrame } from '@/components/consultation/JitsiFrame';

interface ConsultationClientProps {
  appointmentId: string;
  jitsiRoomId: string;
  scheduledAt: string;
  durationMinutes: number;
  patientName: string;
  doctorName: string;
  role: 'patient' | 'doctor';
  currentUserName: string;
}

export function ConsultationClient({
  jitsiRoomId,
  scheduledAt,
  durationMinutes,
  patientName,
  doctorName,
  role,
  currentUserName,
}: ConsultationClientProps) {
  const [joined, setJoined] = useState(false);
  const scheduledAtDate = new Date(scheduledAt);

  if (!joined) {
    return (
      <PreJoinScreen
        patientName={patientName}
        doctorName={doctorName}
        scheduledAt={scheduledAtDate}
        durationMinutes={durationMinutes}
        role={role}
        onJoin={() => setJoined(true)}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <JitsiFrame roomId={jitsiRoomId} displayName={currentUserName} />
    </div>
  );
}
