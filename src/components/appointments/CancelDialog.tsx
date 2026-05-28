'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function CancelDialog({ open, onOpenChange, onConfirm, isPending }: CancelDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim().length < 5) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Please provide a reason for cancellation. This will be shared with the other party.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="cancelReason">Reason</Label>
            <Textarea
              id="cancelReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better, need to reschedule…"
              rows={3}
            />
            {reason.length > 0 && reason.length < 5 && (
              <p className="text-xs text-destructive">Must be at least 5 characters</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length < 5 || isPending}
          >
            {isPending ? 'Cancelling…' : 'Cancel Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
