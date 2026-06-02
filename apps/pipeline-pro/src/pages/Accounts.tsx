import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccounts } from '@/hooks/useAccounts';
import { useDeals } from '@/hooks/useDeals';
import { formatSGD } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';

export default function Accounts() {
  const [search, setSearch] = useState('');
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: deals = [] } = useDeals();

  const enriched = useMemo(() => {
    return accounts.map(acc => {
      const openDeals = deals.filter(d => d.account_id === acc.id && d.stage && !['Closed', 'Lost', 'Won'].includes(d.stage));
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

  if (loadingAccounts) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">Accounts</h1>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm bg-card" />
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
            {filtered.map(acc => (
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
