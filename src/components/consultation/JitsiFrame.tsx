'use client';

interface JitsiFrameProps {
  roomId: string;
  displayName: string;
}

export function JitsiFrame({ roomId, displayName }: JitsiFrameProps) {
  const configParams = new URLSearchParams({
    'config.startWithAudioMuted': 'false',
    'config.prejoinPageEnabled': 'false',
    'userInfo.displayName': displayName,
  }).toString();

  const src = `https://meet.jit.si/${encodeURIComponent(roomId)}#${configParams}`;

  return (
    <iframe
      title="AlalAI Consultation Room"
      src={src}
      allow="camera; microphone; fullscreen; display-capture; autoplay"
      className="w-full h-full rounded-lg border-0"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-modals"
    />
  );
}
