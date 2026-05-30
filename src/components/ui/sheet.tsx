'use client';

import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Sheet({ ...props }: Drawer.Root.Props) {
  return <Drawer.Root {...props} />;
}

function SheetTrigger({ ...props }: Drawer.Trigger.Props) {
  return <Drawer.Trigger {...props} />;
}

function SheetClose({ ...props }: Drawer.Close.Props) {
  return <Drawer.Close {...props} />;
}

interface SheetContentProps extends Drawer.Popup.Props {
  side?: 'left' | 'right';
  showCloseButton?: boolean;
}

function SheetContent({
  side = 'left',
  className,
  children,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <Drawer.Popup
        className={cn(
          'fixed top-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl',
          'duration-200 data-open:animate-in data-closed:animate-out',
          side === 'left'
            ? 'left-0 border-r data-open:slide-in-from-left data-closed:slide-out-to-left'
            : 'right-0 border-l data-open:slide-in-from-right data-closed:slide-out-to-right',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Drawer.Close
            className="absolute right-4 top-4 rounded-sm p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </Drawer.Close>
        )}
      </Drawer.Popup>
    </Drawer.Portal>
  );
}

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 px-4 py-4 border-b', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-lg font-semibold', className)} {...props} />
);
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
