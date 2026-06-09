import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { useDeals } from '@/hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';
import { formatSGD } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '', tier: '' });

  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: deals = [] } = useDeals();
  const createAccount = useCreateAccount();
  const { canRead } = useAuth();

  const enriched = useMemo(() => {
    return accounts.map(acc => {
      const openDeals = deals.filter(d =>
        d.account_id === acc.id &&
        d.stage &&
        !['won', 'lost'].includes(d.stage)
      );
      return {
        ...acc,
        openPipelineValue: openDeals.reduce((s, d) => s + (d.value ?? 0), 0),
        dealCount: openDeals.length,
      };
    });
  }, [accounts, deals]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.industry?.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    createAccount.mutate(
      {
        name: form.name.trim(),
        industry: form.industry.trim() || undefined,
        website: form.website.trim() || undefined,
        tier: form.tier.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success(`"${data.name}" created`);
          setForm({ name: '', industry: '', website: '', tier: '' });
          setShowCreate(false);
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  if (loadingAccounts) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Accounts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each account is a client. Add client managers and projects inside each account.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" />Add Account
        </Button>
      </div>

      {/* Create Account Form */}
      {showCreate && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New Account</p>
            <button onClick={() => setShowCreate(false)}>
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Client / company name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="h-8 text-xs col-span-2"
              autoFocus
            />
            <Input
              placeholder="Industry (e.g. Technology, FMCG)"
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Tier (A, B or C)"
              value={form.tier}
              onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Website"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="h-8 text-xs col-span-2"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="text-xs h-7"
              onClick={handleCreate}
              disabled={createAccount.isPending || !form.name.trim()}
            >
              {createAccount.isPending ? 'Saving...' : 'Save Account'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => { setShowCreate(false); setForm({ name: '', industry: '', website: '', tier: '' }); }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            After saving, open the account to add client managers and projects.
          </p>
        </div>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search accounts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm bg-card"
        />
      </div>

      <div className="data-panel overflow-x-auto p-0">
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th className="text-left">Account</th>
              <th className="text-left">Industry</th>
              <th className="text-center">Tier</th>
              <th className="text-right">Open Pipeline</th>
              <th className="text-center">Deals</th>
              <th className="text-left">Website</th>
              <th className="text-left">Primary Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                  {search ? 'No accounts match your search.' : 'No accounts yet. Click "Add Account" to create your first client.'}
                </td>
              </tr>
            ) : filtered.map(acc => (
              <tr key={acc.id}>
                <td>
                  <Link to={`/accounts/${acc.id}`} className="text-primary hover:underline font-medium text-sm flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 flex-shrink-0" />{acc.name}
                  </Link>
                </td>
                <td className="text-muted-foreground">{acc.industry || '—'}</td>
                <td className="text-center">
                  {acc.tier && <Badge variant={acc.tier === 'A' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">{acc.tier}</Badge>}
                </td>
                <td className="text-right sgd-value">{formatSGD(acc.openPipelineValue)}</td>
                <td className="text-center text-muted-foreground">{acc.dealCount}</td>
                <td className="text-muted-foreground text-xs">{acc.website || '—'}</td>
                <td className="text-muted-foreground text-xs">{acc.primary_contact_name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}