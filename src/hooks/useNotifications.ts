'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationTab = 'new' | 'read' | 'all';

interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  pages: number;
  unreadCount: number;
}

async function fetchNotifications(tab: NotificationTab = 'all'): Promise<NotificationsResponse> {
  const res = await fetch(`/api/notifications?tab=${tab}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json() as Promise<NotificationsResponse>;
}

export function useNotifications(tab: NotificationTab = 'all') {
  return useQuery({
    queryKey: ['notifications', tab],
    queryFn: () => fetchNotifications(tab),
    staleTime: 0,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/**
 * Subscribe to Pusher private channel for real-time notifications.
 * Calls queryClient.invalidateQueries on incoming events.
 * Must be used inside a component with QueryClient available.
 */
export function usePusherNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Lazily import Pusher client only in browser
    let pusherInstance: import('pusher-js').default | null = null;
    let channel: import('pusher-js').Channel | null = null;

    void (async () => {
      try {
        const PusherJS = (await import('pusher-js')).default;
        const { pusherConfig } = await import('@/lib/pusher');

        if (!pusherConfig.key || !pusherConfig.cluster) return;

        pusherInstance = new PusherJS(pusherConfig.key, {
          cluster: pusherConfig.cluster,
          authEndpoint: '/api/pusher/auth',
        });

        channel = pusherInstance.subscribe(`private-user-${userId}`);
        channel.bind('notification', () => {
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });
      } catch {
        // Pusher not available — skip
      }
    })();

    return () => {
      channel?.unbind_all();
      channel?.unsubscribe();
      pusherInstance?.disconnect();
    };
  }, [userId, queryClient]);
}
