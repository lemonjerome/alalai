import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Notification from '@/models/Notification';
import type { INotificationDocument } from '@/models/Notification';

// GET /api/notifications — paginated notifications for current user
// ?tab=new|read|all  (default: all)
// Legacy: ?unreadOnly=true  → equivalent to tab=new
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const tab = searchParams.get('tab'); // 'new' | 'read' | 'all'
  const unreadOnly = searchParams.get('unreadOnly') === 'true'; // legacy
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));

  const query: Record<string, unknown> = { userId: req.session.user.id };

  if (tab === 'new' || unreadOnly) {
    query.isRead = false;
  } else if (tab === 'read') {
    query.isRead = true;
  }
  // tab === 'all' or no tab → no isRead filter

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<INotificationDocument[]>(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.session.user.id, isRead: false }),
  ]);

  return NextResponse.json({ notifications, total, page, pages: Math.ceil(total / limit), unreadCount });
});
