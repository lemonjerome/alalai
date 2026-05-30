'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Calendar,
  Clock,
  User,
  CalendarDays,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CancelDialog } from '@/components/appointments/CancelDialog';
import { RescheduleDialog } from '@/components/appointments/RescheduleDialog';
import { useCancelAppointment, useRescheduleAppointment } from '@/hooks/useAppointments';

interface PreJoinScreenProps {
  appointmentId: string;
  doctorProfileId: string;
  appointmentStatus: string;
  patientName: string;
  doctorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  role: 'patient' | 'doctor';
  onJoin: () => void;
}

// ── Camera Preview ────────────────────────────────────────────────────────────

function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize camera on mount using .then/.catch — setState inside callbacks is
  // allowed by react-hooks/set-state-in-effect; calling setState synchronously in
  // the effect body (or in a function called from it) is what the rule forbids.
  useEffect(() => {
    let cancelled = false;
    // Capture ref values at effect-run time so the cleanup function uses the same node
    const video = videoRef.current;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (video) video.srcObject = stream;
        setCameraOn(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDenied(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, []);

  // Toggle handlers — called from button clicks, not from effects, so setState is fine
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const startCameraToggle = () => {
    setLoading(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
        setLoading(false);
      })
      .catch(() => {
        setDenied(true);
        setLoading(false);
      });
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video w-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cn(
          'w-full h-full object-cover [transform:scaleX(-1)]',
          !cameraOn && 'hidden'
        )}
      />

      {!cameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
          {loading ? (
            <p className="text-sm">Starting camera…</p>
          ) : denied ? (
            <>
              <VideoOff className="h-10 w-10 text-gray-600" />
              <p className="text-sm text-gray-400">Camera access denied</p>
              <p className="text-xs text-gray-500">Allow camera in your browser settings</p>
            </>
          ) : (
            <>
              <User className="h-10 w-10 text-gray-600" />
              <p className="text-sm text-gray-400">Camera is off</p>
            </>
          )}
        </div>
      )}

      {!denied && !loading && (
        <button
          type="button"
          onClick={cameraOn ? stopCamera : startCameraToggle}
          className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
          title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>
      )}

      <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 rounded text-xs text-white/80">
        Your camera
      </div>
    </div>
  );
}

// ── Mic Test ──────────────────────────────────────────────────────────────────

const MIC_BAR_COUNT = 12;

function MicTest() {
  const [testing, setTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [denied, setDenied] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopMic = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setLevel(0);
    setTesting(false);
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(100, (avg / 80) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
      setTesting(true);
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, []);

  useEffect(() => () => stopMic(), [stopMic]);

  const isWorking = testing && level > 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">Microphone Test</span>
        <Button
          size="sm"
          variant={testing ? 'secondary' : 'outline'}
          className="gap-1.5 h-7 text-xs"
          onClick={testing ? stopMic : () => void startMic()}
          disabled={denied}
        >
          {testing ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          {denied ? 'Mic denied' : testing ? 'Stop' : 'Test Mic'}
        </Button>
      </div>

      <div className="flex gap-[3px] items-end h-7 px-0.5">
        {Array.from({ length: MIC_BAR_COUNT }, (_, i) => {
          const threshold = ((i + 1) / MIC_BAR_COUNT) * 100;
          const active = testing && level >= threshold;
          const heightPct = 30 + (i / (MIC_BAR_COUNT - 1)) * 70;
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-sm transition-all duration-75',
                active
                  ? i < 7
                    ? 'bg-green-500'
                    : i < 10
                    ? 'bg-yellow-400'
                    : 'bg-red-500'
                  : 'bg-gray-200'
              )}
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>

      <p className="text-xs text-gray-400 h-4">
        {denied
          ? 'Allow microphone access in your browser settings'
          : isWorking
          ? '✓ Microphone is working'
          : testing
          ? 'Speak into your microphone…'
          : 'Click "Test Mic" to check your audio'}
      </p>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────

function useCountdown(scheduledAt: Date) {
  const [diff, setDiff] = useState(() => scheduledAt.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(scheduledAt.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  return diff;
}

// ── PreJoinScreen ─────────────────────────────────────────────────────────────

export function PreJoinScreen({
  appointmentId,
  doctorProfileId,
  appointmentStatus,
  patientName,
  doctorName,
  scheduledAt,
  durationMinutes,
  role,
  onJoin,
}: PreJoinScreenProps) {
  const router = useRouter();
  const diff = useCountdown(scheduledAt);
  const canJoin = diff <= 0 && appointmentStatus === 'confirmed';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const counterpartName = role === 'patient' ? `Dr. ${doctorName}` : patientName;
  const isActive = ['pending', 'confirmed'].includes(appointmentStatus);
  const backHref = role === 'patient' ? '/appointments' : '/doctor/appointments';

  const handleCancel = (reason: string) => {
    cancelMutation.mutate(
      { id: appointmentId, reason },
      {
        onSuccess: () => {
          toast.success('Appointment cancelled');
          router.push(backHref);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleReschedule = (scheduledAtISO: string) => {
    rescheduleMutation.mutate(
      { id: appointmentId, scheduledAt: scheduledAtISO, durationMinutes },
      {
        onSuccess: () => {
          toast.success('Appointment rescheduled');
          setRescheduleOpen(false);
          router.push(backHref);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-2xl border-gray-200">
          <CardContent className="pt-6 pb-8 space-y-5">

            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold text-gray-900">
                {role === 'patient'
                  ? `Dr. ${doctorName}'s Session Room`
                  : `Session with ${patientName}`}
              </h1>
              <p className="text-sm text-gray-500">with {counterpartName}</p>
            </div>

            {/* Appointment info chips */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
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
                })}{' '}
                · {durationMinutes} min
              </span>
            </div>

            {/* Status banner for non-confirmed appointments */}
            {appointmentStatus === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 text-center">
                This appointment has been cancelled.
              </div>
            )}
            {appointmentStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3 text-center">
                Waiting for the doctor to confirm this appointment.
              </div>
            )}
            {appointmentStatus === 'completed' && (
              <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-4 py-3 text-center">
                This consultation has already been completed.
              </div>
            )}

            {/* Camera preview — always show so users can test setup */}
            <CameraPreview />

            {/* Mic test */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
              <MicTest />
            </div>

            {/* Countdown / ready indicator */}
            {appointmentStatus === 'confirmed' && (
              <div className="text-center">
                {!canJoin ? (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      Session starts in
                    </p>
                    <p className="text-3xl font-mono font-bold text-gray-900 tabular-nums">
                      {hours > 0
                        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-green-600">
                    ✓ Session is ready — you can join now
                  </p>
                )}
              </div>
            )}

            {/* Join button */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={onJoin}
              disabled={!canJoin}
            >
              <Video className="h-5 w-5" />
              {canJoin
                ? 'Join Session'
                : appointmentStatus === 'confirmed'
                ? 'Waiting for session time…'
                : 'Session not available'}
            </Button>

            {appointmentStatus === 'confirmed' && !canJoin && (
              <p className="text-xs text-gray-400 text-center -mt-2">
                Use the camera and mic above to get ready. The button unlocks at your scheduled time.
              </p>
            )}

            {/* Cancel / Reschedule actions */}
            {isActive && (
              <div className="flex gap-2 pt-1">
                {role === 'patient' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => setRescheduleOpen(true)}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5',
                    role === 'patient' ? 'flex-1' : 'w-full'
                  )}
                  onClick={() => setCancelOpen(true)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation modals */}
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
          appointmentId={appointmentId}
          doctorProfileId={doctorProfileId}
          durationMinutes={durationMinutes}
          isPending={rescheduleMutation.isPending}
          onConfirm={handleReschedule}
        />
      )}
    </>
  );
}
