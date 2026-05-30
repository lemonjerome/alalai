'use client';

import { useState } from 'react';
import { Menu, Heart, Stethoscope } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PatientNav } from '@/components/layout/PatientNav';
import { DoctorNav } from '@/components/layout/DoctorNav';

interface MobileHeaderProps {
  role: 'patient' | 'doctor';
}

export function MobileHeader({ role }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2">
        {role === 'patient' ? (
          <Heart className="h-5 w-5 text-primary fill-primary" />
        ) : (
          <Stethoscope className="h-5 w-5 text-primary" />
        )}
        <span className="font-bold text-lg tracking-tight"><span className="text-gray-900">Alal</span><span className="text-primary">AI</span></span>
      </div>

      {/* Hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </SheetTrigger>
        <SheetContent side="left">
          {/* Render the full nav inside the drawer */}
          <div className="flex flex-col h-full pt-10" onClick={() => setOpen(false)}>
            {role === 'patient' ? <PatientNav /> : <DoctorNav />}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
