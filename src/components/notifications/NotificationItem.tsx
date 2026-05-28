'use client';

import { Bell, CalendarCheck, CalendarX, Clock, FileText, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarkRead } from '@/hooks/useNotifications';
import type { NotificationItem } from '@/hooks/useNotifications';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  appointment_booked: CalendarCheck,
  appointment_cancelled: CalendarX,
  appointment_rescheduled: RotateCcw,
  appointment_reminder: Clock,
  record_available: FileText,
};

interface NotificationItemProps {
  notification: NotificationItem;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationItemRow({ notification }: NotificationItemProps) {
  const markRead = useMarkRead();
  const Icon = TYPE_ICONS[notification.type] ?? Bell;

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.isRead) {
          markRead.mutate(String(notification._id));
        }
      }}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
        !notification.isRead && 'bg-primary/5'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-full shrink-0 mt-0.5',
          !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', !notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <span className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
      )}
    </button>
  );
}
