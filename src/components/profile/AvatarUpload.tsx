'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadAvatar } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentUrl?: string | null;
  name?: string | null;
}

export function AvatarUpload({ currentUrl, name }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { mutate: upload, isPending } = useUploadAvatar();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    upload(file, {
      onError: () => setPreview(null), // revert preview on failure
    });
  }

  const displayUrl = preview ?? currentUrl;
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className={cn(
          'relative w-24 h-24 rounded-full overflow-hidden',
          'bg-muted border-2 border-border',
          'hover:opacity-80 transition-opacity cursor-pointer',
          isPending && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Change profile picture"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={name ?? 'Profile picture'}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xl font-semibold text-muted-foreground">
              {initials}
            </span>
          </div>
        )}

        {/* Overlay icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
          <Upload size={20} className="text-white" />
        </div>
      </button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        <User size={14} className="mr-1" />
        {isPending ? 'Uploading…' : 'Change photo'}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · Max 5 MB</p>
    </div>
  );
}
