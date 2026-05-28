'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology',
];

export function DoctorFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const specialization = searchParams.get('specialization') ?? '';
  const availableOn = searchParams.get('availableOn') ?? '';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset to page 1 on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = search || specialization || availableOn;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Label htmlFor="search" className="text-sm font-medium">
          Search
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Name, specialization, bio…"
            className="pl-8"
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('search', e.currentTarget.value);
              }
            }}
            onBlur={(e) => updateParam('search', e.currentTarget.value)}
          />
        </div>
      </div>

      {/* Specialization */}
      <div>
        <Label className="text-sm font-medium">Specialization</Label>
        <Select
          value={specialization || null}
          onValueChange={(val: string | null) => updateParam('specialization', val === 'all' || !val ? '' : val)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specializations</SelectItem>
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Available On */}
      <div>
        <Label htmlFor="availableOn" className="text-sm font-medium">
          Available On
        </Label>
        <Input
          id="availableOn"
          type="date"
          className="mt-1"
          value={availableOn}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => updateParam('availableOn', e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="w-full text-gray-500" onClick={clearAll}>
          <X className="h-3.5 w-3.5 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
