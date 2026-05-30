'use client';

import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications';
import type { NotificationTab } from '@/hooks/useNotifications';
import { NotificationItemRow } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';

function NotificationList({
  tab,
  emptyMessage,
}: {
  tab: NotificationTab;
  emptyMessage: string;
}) {
  const { data, isLoading } = useNotifications(tab);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const notifications = data?.notifications ?? [];

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-base font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {notifications.map((n) => (
        <NotificationItemRow key={String(n._id)} notification={n} />
      ))}
    </div>
  );
}

export default function DoctorNotificationsPage() {
  const { data: allData } = useNotifications('all');
  const markAllRead = useMarkAllRead();
  const unreadCount = allData?.unreadCount ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Patient activity and appointment updates</p>
        </div>
        {unreadCount > 0 && (
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

      <div className="bg-white rounded-xl border overflow-hidden">
        <Tabs defaultValue="new">
          <div className="px-4 py-3 border-b">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1 gap-1.5">
                New
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" className="flex-1">Read</TabsTrigger>
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="new" className="mt-0">
            <NotificationList tab="new" emptyMessage="No new notifications" />
          </TabsContent>
          <TabsContent value="read" className="mt-0">
            <NotificationList tab="read" emptyMessage="No read notifications" />
          </TabsContent>
          <TabsContent value="all" className="mt-0">
            <NotificationList tab="all" emptyMessage="No notifications yet" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
