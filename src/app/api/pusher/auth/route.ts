import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

// POST /api/pusher/auth — Pusher private channel authentication
// The client sends socket_id + channel_name; we verify the user owns the channel.
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const socketId = formData.get('socket_id') as string;
  const channel = formData.get('channel_name') as string;

  // Only allow subscribing to own private channel
  const expectedChannel = `private-user-${session.user.id}`;
  if (channel !== expectedChannel) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pusher = getPusherServer();
    const authResponse = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);
  } catch {
    return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
  }
}
