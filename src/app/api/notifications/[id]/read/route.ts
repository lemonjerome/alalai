import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import Notification from '@/models/Notification';
import type { INotificationDocument } from '@/models/Notification';

// PATCH /api/notifications/[id]/read — mark single notification read
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, { params }) => {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    await connectDB();

    // Ownership enforced in query
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.session.user.id },
      { isRead: true },
      { new: true }
    ).lean<INotificationDocument>();

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  }
);
