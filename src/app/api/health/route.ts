import { NextResponse } from 'next/server';

// GET /api/health — smoke test and uptime monitoring endpoint
export function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
