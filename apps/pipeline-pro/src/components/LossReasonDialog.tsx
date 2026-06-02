import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LossReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  dealTitle: string;
  saving?: boolean;
}

export function LossReasonDialog({ open, onClose, onConfirm, dealTitle, saving }: LossReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Deal as Lost</DialogTitle>
          <DialogDescription>
            Please provide a reason for losing "{dealTitle}". This helps improve future deal strategies.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="section-label">Loss Reason (required)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Budget constraints, competitor won, project cancelled..."
            className="min-h-[100px] text-sm bg-muted"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || saving}
            className="text-xs"
          >
            {saving ? 'Saving...' : 'Mark as Lost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
