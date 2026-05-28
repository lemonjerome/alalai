import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center">
          <SearchX className="h-8 w-8 text-sky-500" />
        </div>
        <div>
          <p className="text-6xl font-bold text-gray-200">404</p>
          <h1 className="text-2xl font-bold text-gray-900 -mt-2">Page not found</h1>
          <p className="text-sm text-gray-500 mt-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </div>
    </div>
  );
}
