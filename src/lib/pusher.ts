import Pusher from 'pusher';

// Server-side Pusher instance — only instantiated in Node.js context
let _pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (_pusherServer) return _pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('Missing Pusher server environment variables');
  }

  _pusherServer = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return _pusherServer;
}

// Client-side Pusher config — values exposed via NEXT_PUBLIC_
export const pusherConfig = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY ?? '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
};
