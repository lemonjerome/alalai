'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  FileText,
  Bell,
  User,
  LogOut,
  Heart,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Find Doctors', icon: Stethoscope },
  { href: '/doctors/recommend', label: 'Find by Symptoms', icon: Sparkles },
  { href: '/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/records', label: 'Medical Records', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'My Profile', icon: User },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function PatientNav() {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const { data: notifData } = useNotifications('new');
  const user = data?.user as { name?: string; email?: string; profilePictureUrl?: string } | undefined;
  const unreadCount = notifData?.unreadCount ?? 0;

  return (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-bold text-lg tracking-tight"><span className="text-gray-900">Alal</span><span className="text-primary">AI</span></span>
      </div>

      {/* Links */}
      <ul className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const isNotifications = href === '/notifications';
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className={cn(
                    'text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none min-w-[1.25rem] text-center',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-primary text-primary-foreground'
                  )}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* User footer */}
      <div className="border-t px-3 py-3 space-y-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <NotificationBell />
        </div>
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profilePictureUrl} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user?.name ? initials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? '…'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-500"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </nav>
  );
}
