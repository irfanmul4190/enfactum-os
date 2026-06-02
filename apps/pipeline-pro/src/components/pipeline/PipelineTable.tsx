import { Link } from 'react-router-dom';
import { formatSGD } from '@/lib/format';
import { StageBadge } from '@/components/StatusBadges';
import { Badge } from '@/components/ui/badge';
import type { Stage } from '@/types';
import type { DbVDeal } from '@/integrations/supabase/db';

export function PipelineTable({ deals }: { deals: DbVDeal[] }) {
  return (
    <div className="data-panel overflow-x-auto p-0">
      <table className="w-full table-compact">
        <thead>
          <tr>
            <th className="text-left">Account</th>
            <th className="text-left">Deal</th>
            <th className="text-left">Stage</th>
            <th className="text-left">Owner</th>
            <th className="text-right">Value</th>
            <th className="text-right">Win Prob</th>
            <th className="text-right">Weighted</th>
            <th className="text-right">GP%</th>
            <th className="text-center">MDF</th>
            <th className="text-left">Expected Close</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id}>
              <td className="font-medium">{d.account_name}</td>
              <td>
                <Link to={`/opportunity/${d.id}`} className="text-primary hover:underline">{d.title}</Link>
              </td>
              <td><StageBadge stage={(d.stage as Stage) || 'Prospect'} /></td>
              <td className="text-muted-foreground">{d.owner_name}</td>
              <td className="text-right sgd-value">{formatSGD(d.value ?? 0)}</td>
              <td className="text-right font-mono text-muted-foreground">{Math.round((d.win_probability ?? 0) * 100)}%</td>
              <td className="text-right sgd-value">{formatSGD((d.value ?? 0) * (d.win_probability ?? 0))}</td>
              <td className="text-right font-mono text-muted-foreground">{d.gp_percent != null ? `${d.gp_percent.toFixed(1)}%` : '—'}</td>
              <td className="text-center">{d.mdf_eligible ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">🏷️ MDF</Badge> : '—'}</td>
              <td className="text-muted-foreground text-xs">{d.expected_close_date || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
