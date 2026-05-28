'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATIONS = [15, 30, 60, 120];

const slotFormSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  slotDurationMinutes: z.coerce.number().int().min(15).max(120),
  isActive: z.boolean(),
});

type SlotFormValues = z.input<typeof slotFormSchema>;

interface AvailabilitySlot {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  blockedDates: string[];
}

async function fetchSlots(): Promise<AvailabilitySlot[]> {
  const res = await fetch('/api/doctors/me/availability');
  if (!res.ok) throw new Error('Failed to fetch slots');
  const data = await res.json() as { slots: AvailabilitySlot[] };
  return data.slots;
}

async function createSlot(body: SlotFormValues): Promise<AvailabilitySlot> {
  const res = await fetch('/api/doctors/me/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? 'Failed to create slot');
  }
  const data = await res.json() as { slot: AvailabilitySlot };
  return data.slot;
}

async function deleteSlot(slotId: string): Promise<void> {
  const res = await fetch(`/api/doctors/me/availability/${slotId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete slot');
}

async function toggleSlot(slotId: string, isActive: boolean): Promise<AvailabilitySlot> {
  const res = await fetch(`/api/doctors/me/availability/${slotId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error('Failed to update slot');
  const data = await res.json() as { slot: AvailabilitySlot };
  return data.slot;
}

export function AvailabilityManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: slots, isLoading } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: fetchSlots,
    staleTime: 2 * 60 * 1000,
  });

  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
      isActive: true,
    },
  });

  // useWatch is memoization-safe (unlike form.watch())
  const watchedDayOfWeek = useWatch({ control: form.control, name: 'dayOfWeek' });
  const watchedDuration = useWatch({ control: form.control, name: 'slotDurationMinutes' });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['myAvailability'] });

  const createMutation = useMutation({
    mutationFn: createSlot,
    onSuccess: () => {
      toast.success('Availability slot added');
      setIsDialogOpen(false);
      form.reset();
      void invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSlot,
    onSuccess: () => {
      toast.success('Slot deleted');
      void invalidate();
    },
    onError: () => toast.error('Failed to delete slot'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleSlot(id, isActive),
    onSuccess: () => void invalidate(),
    onError: () => toast.error('Failed to update slot'),
  });

  const slotsByDay = slots?.reduce<Record<number, AvailabilitySlot[]>>((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Availability</h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Slot
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && slots?.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          No availability slots set. Click &quot;Add Slot&quot; to get started.
        </p>
      )}

      {Object.entries(slotsByDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([dow, daySlots]) => (
          <div key={dow}>
            <p className="text-sm font-medium text-gray-600 mb-2">{DAY_NAMES[Number(dow)]}</p>
            <div className="space-y-2">
              {daySlots.map((slot) => (
                <Card key={slot._id} className={slot.isActive ? '' : 'opacity-50'}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {slot.slotDurationMinutes}min slots
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={slot.isActive}
                        onCheckedChange={(checked: boolean) =>
                          toggleMutation.mutate({ id: slot._id, isActive: checked })
                        }
                        aria-label="Toggle slot active"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(slot._id)}
                        aria-label="Delete slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

      {/* Add Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            {/* Day of Week */}
            <div className="space-y-1.5">
              <Label>Day of Week</Label>
              <Select
                value={String(watchedDayOfWeek)}
                onValueChange={(v: string | null) => form.setValue('dayOfWeek', Number(v ?? 0))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" {...form.register('startTime')} />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" {...form.register('endTime')} />
                {form.formState.errors.endTime && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Slot Duration */}
            <div className="space-y-1.5">
              <Label>Appointment Duration</Label>
              <Select
                value={String(watchedDuration)}
                onValueChange={(v: string | null) => form.setValue('slotDurationMinutes', Number(v ?? 30))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding…' : 'Add Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
