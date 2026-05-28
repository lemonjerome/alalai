'use client';

import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationItemRow } from '@/components/notifications/NotificationItem';
import { useNotifications, useMarkAllRead, usePusherNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export function NotificationBell() {
  const { data: session } = useSession();
  const { data, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  // Subscribe to real-time Pusher events
  usePusherNotifications(session?.user?.id);

  // Show toast on new incoming notification via Pusher
  // (The toast is shown from the Pusher event handler in the providers layer — see Phase 5.2 note)

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = (data?.notifications ?? []).slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger>
        <button
          type="button"
          className="relative p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              className="text-xs text-primary"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItemRow key={String(n._id)} notification={n} />
            ))
          )}
        </div>

        {(data?.total ?? 0) > 10 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <a
                href="/notifications"
                className="text-xs text-primary hover:underline"
              >
                View all {data?.total} notifications
              </a>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
