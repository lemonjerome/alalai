'use client';

import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications';
import { NotificationItemRow } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

export default function PatientNotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Your activity and appointment updates</p>
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border divide-y overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (data?.notifications ?? []).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-gray-500">No notifications yet</p>
            <p className="text-sm mt-1">You&apos;ll see updates about your appointments here.</p>
          </div>
        ) : (
          (data?.notifications ?? []).map((n) => (
            <NotificationItemRow key={String(n._id)} notification={n} />
          ))
        )}
      </div>
    </div>
  );
}
