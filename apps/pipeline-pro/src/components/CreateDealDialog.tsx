import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccounts } from '@/hooks/useAccounts';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateDeal } from '@/hooks/useDeals';
import { useEmployee } from '@/contexts/EmployeeContext';
import { logEvent } from '@/lib/events';
import { STAGES_ORDERED } from '@/types';
import { toast } from 'sonner';

interface CreateDealDialogProps {
  open: boolean;
  onClose: () => void;
}

const WIN_PROBABILITIES = [10, 25, 50, 75, 90];
const CURRENCIES = ['SGD', 'USD', 'INR', 'MYR'];
const SELECT_CLASS = 'h-9 w-full rounded-md border border-input bg-muted px-2.5 text-sm';

export function CreateDealDialog({ open, onClose }: Readonly<CreateDealDialogProps>) {
  const { data: accounts = [] } = useAccounts();
  const { data: employees = [] } = useEmployees();
  const createDeal = useCreateDeal();
  const { employee } = useEmployee();

  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [stage, setStage] = useState<string>('Prospect');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [winProb, setWinProb] = useState('25');
  const [closeDate, setCloseDate] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setTitle('');
    setAccountId('');
    setOwnerId('');
    setStage('Prospect');
    setValue('');
    setCurrency('SGD');
    setWinProb('25');
    setCloseDate('');
    setDescription('');
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const deal: Record<string, unknown> = {
      title: title.trim(),
      account_id: accountId || null,
      owner_id: ownerId || null,
      stage,
      value: value ? Number(value) : null,
      currency,
      win_probability: Number(winProb) / 100,
      expected_close_date: closeDate || null,
      description: description.trim() || null,
    };
    createDeal.mutate(deal, {
      onSuccess: (created: { id?: string }) => {
        logEvent({
          entity_type: 'deal',
          entity_id: created?.id,
          event_type: 'deal.created',
          payload: { title: deal.title, value: deal.value, stage },
          actor_id: employee?.id,
        });
        toast.success(`Deal "${deal.title}" created`);
        reset();
        onClose();
      },
      onError: (err) => toast.error('Failed to create deal: ' + (err as Error).message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Opportunity</DialogTitle>
          <DialogDescription>Add a new deal to the pipeline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="section-label">Title (required)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HP — Q3 Managed Services"
              className="h-9 text-sm bg-muted"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="section-label">Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={SELECT_CLASS}>
                <option value="">— None —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="section-label">Owner</label>
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={SELECT_CLASS}>
                <option value="">— Unassigned —</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="section-label">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={SELECT_CLASS}>
                {STAGES_ORDERED.filter((s) => s !== 'Lost').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="section-label">Value</label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="h-9 text-sm bg-muted"
              />
            </div>
            <div className="space-y-1">
              <label className="section-label">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={SELECT_CLASS}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="section-label">Win Probability</label>
              <select value={winProb} onChange={(e) => setWinProb(e.target.value)} className={SELECT_CLASS}>
                {WIN_PROBABILITIES.map((p) => <option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="section-label">Expected Close</label>
              <Input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="h-9 text-sm bg-muted"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="section-label">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context..."
              className="min-h-[70px] text-sm bg-muted"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || createDeal.isPending} className="text-xs">
            {createDeal.isPending ? 'Creating...' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
