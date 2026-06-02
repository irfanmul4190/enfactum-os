import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatSGD } from '@/lib/format';
import { StageBadge } from '@/components/StatusBadges';
import { Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DbVDeal } from '@/integrations/supabase/db';

interface Props {
  deals: DbVDeal[];
  onStageChange: (dealId: string, newStage: any) => void;
}

interface ClientGroup {
  accountId: string | null;
  accountName: string;
  deals: DbVDeal[];
  totalValue: number;
  openValue: number;
}

export function ClientsView({ deals, onStageChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const clients = useMemo(() => {
    const map = new Map<string, ClientGroup>();

    deals.forEach(deal => {
      const key = deal.account_id ?? 'no-account';
      const name = deal.account_name ?? 'No Account';

      if (!map.has(key)) {
        map.set(key, {
          accountId: deal.account_id ?? null,
          accountName: name,
          deals: [],
          totalValue: 0,
          openValue: 0,
        });
      }

      const group = map.get(key)!;
      group.deals.push(deal);
      group.totalValue += deal.value ?? 0;
      if (!['won', 'lost'].includes(deal.stage ?? '')) {
        group.openValue += deal.value ?? 0;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.accountName.localeCompare(b.accountName)
    );
  }, [deals]);

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(clients.map(c => c.accountId ?? 'no-account')));
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-end">
        <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground">
          Expand all
        </button>
        <span className="text-muted-foreground text-xs">·</span>
        <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">
          Collapse all
        </button>
      </div>

      {clients.map(client => {
        const key = client.accountId ?? 'no-account';
        const isOpen = expanded.has(key);
        const wonDeals = client.deals.filter(d => d.stage === 'won').length;
        const activeDeals = client.deals.filter(d => !['won', 'lost'].includes(d.stage ?? '')).length;

        return (
          <div key={key} className="border border-border rounded-lg bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              onClick={() => toggleExpand(key)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                }
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{client.accountName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {client.deals.length} deal{client.deals.length !== 1 ? 's' : ''}
                    {activeDeals > 0 && ` · ${activeDeals} active`}
                    {wonDeals > 0 && ` · ${wonDeals} won`}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-medium sgd-value">{formatSGD(client.openValue)}</p>
                <p className="text-[10px] text-muted-foreground">open pipeline</p>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border">
                <table className="w-full table-compact">
                  <thead>
                    <tr>
                      <th className="text-left pl-10">Deal</th>
                      <th className="text-left">Stage</th>
                      <th className="text-right">Value</th>
                      <th className="text-left">Owner</th>
                      <th className="text-left">Close Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.deals.map(deal => (
                      <tr key={deal.id}>
                        <td className="pl-10">
                          <Link
                            to={`/opportunity/${deal.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            {deal.title}
                          </Link>
                        </td>
                        <td>
                          <StageBadge stage={deal.stage ?? 'prospect'} />
                        </td>
                        <td className="text-right sgd-value">
                          {deal.value ? formatSGD(deal.value) : '—'}
                        </td>
                        <td className="text-muted-foreground text-xs">
                          {deal.owner_name ?? '—'}
                        </td>
                        <td className="text-muted-foreground text-xs">
                          {deal.expected_close_date ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}