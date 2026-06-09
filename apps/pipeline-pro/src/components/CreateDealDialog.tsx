import { useState, useMemo } from 'react';
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
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateDeal } from '@/hooks/useDeals';
import { useContacts, useAddContact } from '@/hooks/useContacts';
import { useEmployee } from '@/contexts/EmployeeContext';
import { logEvent } from '@/lib/events';
import { STAGES_ORDERED } from '@/types';
import { toast } from 'sonner';
import { Plus, ChevronRight } from 'lucide-react';

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
  const createAccount = useCreateAccount();
  const addContact = useAddContact();
  const { employee } = useEmployee();

  // Step tracking — 1: Account, 2: Client Manager, 3: Deal details
  const [step, setStep] = useState(1);

  // Step 1 — Account
  const [accountId, setAccountId] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountIndustry, setNewAccountIndustry] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Step 2 — Client Manager
  const { data: contacts = [] } = useContacts(accountId || undefined);
  const [contactId, setContactId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [creatingContact, setCreatingContact] = useState(false);

  // Step 3 — Deal details
  const [title, setTitle] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [stage, setStage] = useState<string>('prospect');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [winProb, setWinProb] = useState('25');
  const [closeDate, setCloseDate] = useState('');
  const [description, setDescription] = useState('');

  const selectedAccount = accounts.find(a => a.id === accountId);

  const reset = () => {
    setStep(1);
    setAccountId('');
    setNewAccountName('');
    setNewAccountIndustry('');
    setCreatingAccount(false);
    setContactId('');
    setNewContactName('');
    setNewContactEmail('');
    setNewContactRole('');
    setCreatingContact(false);
    setTitle('');
    setOwnerId('');
    setStage('prospect');
    setValue('');
    setCurrency('SGD');
    setWinProb('25');
    setCloseDate('');
    setDescription('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) { toast.error('Account name is required'); return; }
    createAccount.mutate(
      { name: newAccountName.trim(), industry: newAccountIndustry.trim() || undefined },
      {
        onSuccess: (data) => {
          setAccountId(data.id);
          setNewAccountName('');
          setNewAccountIndustry('');
          setCreatingAccount(false);
          toast.success(`"${data.name}" created`);
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  const handleCreateContact = async () => {
    if (!newContactName.trim()) { toast.error('Contact name is required'); return; }
    if (!accountId) { toast.error('Select an account first'); return; }
    addContact.mutate(
      {
        account_id: accountId,
        name: newContactName.trim(),
        email: newContactEmail.trim() || undefined,
        role: newContactRole.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setContactId(data.id);
          setNewContactName('');
          setNewContactEmail('');
          setNewContactRole('');
          setCreatingContact(false);
          toast.success(`Contact "${data.name}" added`);
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
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
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Opportunity</DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-1 text-xs">
              <span className={step >= 1 ? 'text-primary font-medium' : ''}>1. Account</span>
              <ChevronRight className="h-3 w-3" />
              <span className={step >= 2 ? 'text-primary font-medium' : ''}>2. Client Manager</span>
              <ChevronRight className="h-3 w-3" />
              <span className={step >= 3 ? 'text-primary font-medium' : ''}>3. Deal Details</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* ─── Step 1: Account ─── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="section-label">Select existing account</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">— Select account —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!creatingAccount ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 w-full"
                onClick={() => setCreatingAccount(true)}
              >
                <Plus className="h-3 w-3 mr-1" />Create new account
              </Button>
            ) : (
              <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-medium">New Account</p>
                <Input
                  placeholder="Company / client name *"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Input
                  placeholder="Industry (optional)"
                  value={newAccountIndustry}
                  onChange={e => setNewAccountIndustry(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7"
                    onClick={handleCreateAccount}
                    disabled={createAccount.isPending || !newAccountName.trim()}>
                    {createAccount.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => setCreatingAccount(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Client Manager ─── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
              Account: <span className="font-medium text-foreground">{selectedAccount?.name}</span>
            </div>

            <div className="space-y-1">
              <label className="section-label">Select client manager</label>
              <select
                value={contactId}
                onChange={e => setContactId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">— Select or skip —</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.role ? ` (${c.role})` : ''}{c.email ? ` — ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {!creatingContact ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 w-full"
                onClick={() => setCreatingContact(true)}
              >
                <Plus className="h-3 w-3 mr-1" />Add new client manager
              </Button>
            ) : (
              <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-medium">New Client Manager</p>
                <Input placeholder="Full name *" value={newContactName}
                  onChange={e => setNewContactName(e.target.value)} className="h-8 text-xs" autoFocus />
                <Input placeholder="Email" value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Role / title" value={newContactRole}
                  onChange={e => setNewContactRole(e.target.value)} className="h-8 text-xs" />
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7"
                    onClick={handleCreateContact}
                    disabled={addContact.isPending || !newContactName.trim()}>
                    {addContact.isPending ? 'Adding...' : 'Add'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => setCreatingContact(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Deal Details ─── */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2 flex items-center gap-1">
              <span className="font-medium text-foreground">{selectedAccount?.name}</span>
              {contactId && contacts.find(c => c.id === contactId) && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">
                    {contacts.find(c => c.id === contactId)?.name}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-1">
              <label className="section-label">Title (required)</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. HP — Q3 Managed Services"
                className="h-9 text-sm bg-muted"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="section-label">Owner</label>
              <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className={SELECT_CLASS}>
                <option value="">— Unassigned —</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="section-label">Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value)} className={SELECT_CLASS}>
                  {STAGES_ORDERED.filter(s => s !== 'Lost').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="section-label">Value</label>
                <Input type="number" value={value} onChange={e => setValue(e.target.value)}
                  placeholder="0" className="h-9 text-sm bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="section-label">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={SELECT_CLASS}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="section-label">Win Probability</label>
                <select value={winProb} onChange={e => setWinProb(e.target.value)} className={SELECT_CLASS}>
                  {WIN_PROBABILITIES.map(p => <option key={p} value={p}>{p}%</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="section-label">Expected Close</label>
                <Input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)}
                  className="h-9 text-sm bg-muted" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="section-label">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Optional context..." className="min-h-[70px] text-sm bg-muted" />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-xs">
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-xs">Cancel</Button>
          </div>
          <div>
            {step < 3 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !accountId}
                className="text-xs"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || createDeal.isPending}
                className="text-xs"
              >
                {createDeal.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}