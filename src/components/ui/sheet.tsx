'use client';

import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = Drawer.Root;
const SheetTrigger = Drawer.Trigger;

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Drawer.Close
    ref={ref}
    className={cn('rounded-sm opacity-70 hover:opacity-100', className)}
    {...props}
  />
));
SheetClose.displayName = 'SheetClose';

interface SheetContentProps {
  side?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

function SheetContent({ side = 'left', className, children }: SheetContentProps) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <Drawer.Popup
        className={cn(
          'fixed z-50 bg-background shadow-xl flex flex-col',
          'data-[ending-style]:transition-transform data-[ending-style]:duration-200',
          side === 'left'
            ? 'inset-y-0 left-0 h-full w-64 border-r'
            : 'inset-y-0 right-0 h-full w-64 border-l',
          className
        )}
      >
        {children}
        <Drawer.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Drawer.Close>
      </Drawer.Popup>
    </Drawer.Portal>
  );
}

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 px-4 py-4 border-b', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-lg font-semibold', className)} {...props} />
);
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle };
