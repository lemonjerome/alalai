import { Heart } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Heart className="h-10 w-10 text-primary fill-primary animate-pulse" />
        <p className="text-sm text-gray-500 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}
