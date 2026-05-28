import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Notification from '@/models/Notification';

// PATCH /api/notifications/read-all — mark all notifications read for current user
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  await connectDB();

  await Notification.updateMany(
    { userId: req.session.user.id, isRead: false },
    { isRead: true }
  );

  return NextResponse.json({ message: 'All notifications marked as read' });
});
