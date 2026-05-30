import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for the Dockerfile's standalone output (node server.js)
  output: 'standalone',

  // Skip tsc and eslint during `next build` — they run in CI (npm run type-check / lint).
  // This prevents OOM kills in Docker where memory is constrained.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Allow next/image to load profile pictures from Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval needed for Next.js dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com",
              "font-src 'self'",
              "frame-src 'self' https://meet.jit.si",  // Jitsi video consultation
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://sockjs-mt1.pusher.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
