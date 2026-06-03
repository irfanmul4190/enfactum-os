import { useMemo } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { formatSGD } from '@/lib/format';
import { TrendingUp, Target, AlertCircle } from 'lucide-react';

const STAGE_ORDER = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'];
const ACTIVE_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation'];

export default function FunnelAnalytics() {
  const { data: deals = [], isLoading } = useDeals();

  const stats = useMemo(() => {
    const total = deals.length;
    const won = deals.filter(d => d.stage === 'won');
    const lost = deals.filter(d => d.stage === 'lost');
    const active = deals.filter(d => ACTIVE_STAGES.includes(d.stage ?? ''));

    const wonValue = won.reduce((s, d) => s + (d.value ?? 0), 0);
    const lostValue = lost.reduce((s, d) => s + (d.value ?? 0), 0);
    const activeValue = active.reduce((s, d) => s + (d.value ?? 0), 0);
    const totalClosed = won.length + lost.length;
    const winRate = totalClosed > 0 ? (won.length / totalClosed) * 100 : 0;
    const avgDealSize = won.length > 0 ? wonValue / won.length : 0;

    // Pipeline needed for $1M
    const pipelineFor1MMonth = winRate > 0 ? (1000000 / (winRate / 100)) : 0;
    const pipelineFor1MYear = winRate > 0 ? (12000000 / (winRate / 100)) : 0;

    // Stage breakdown
    const stageBreakdown = STAGE_ORDER.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
      return { stage, count: stageDeals.length, value: stageValue };
    });

    // Owner breakdown
    const ownerMap = new Map<string, { won: number; total: number; value: number }>();
    deals.forEach(d => {
      const owner = d.owner_name ?? 'Unassigned';
      if (!ownerMap.has(owner)) ownerMap.set(owner, { won: 0, total: 0, value: 0 });
      const o = ownerMap.get(owner)!;
      o.total++;
      if (d.stage === 'won') { o.won++; o.value += d.value ?? 0; }
    });
    const ownerStats = Array.from(ownerMap.entries())
      .map(([name, s]) => ({
        name,
        winRate: s.total > 0 ? (s.won / s.total) * 100 : 0,
        wonValue: s.value,
        totalDeals: s.total,
      }))
      .sort((a, b) => b.wonValue - a.wonValue);

    return {
      total, won: won.length, lost: lost.length, active: active.length,
      wonValue, lostValue, activeValue, winRate, avgDealSize,
      pipelineFor1MMonth, pipelineFor1MYear, stageBreakdown, ownerStats,
    };
  }, [deals]);

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const maxStageValue = Math.max(...stats.stageBreakdown.map(s => s.value));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold">Funnel Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, sub: `${stats.won} won / ${stats.won + stats.lost} closed` },
          { label: 'Avg Deal Size', value: formatSGD(stats.avgDealSize), sub: 'from won deals' },
          { label: 'Active Pipeline', value: formatSGD(stats.activeValue), sub: `${stats.active} open deals` },
          { label: 'Total Won', value: formatSGD(stats.wonValue), sub: `${stats.won} deals` },
        ].map(kpi => (
          <div key={kpi.label} className="data-panel">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-lg font-bold mt-1">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline needed for $1M */}
      <div className="data-panel space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Pipeline needed to hit $1M</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Per month</p>
            <p className="text-2xl font-bold text-primary">{formatSGD(stats.pipelineFor1MMonth)}</p>
            <p className="text-[10px] text-muted-foreground">
              Based on {stats.winRate.toFixed(1)}% win rate — need {(1 / (stats.winRate / 100)).toFixed(1)}x pipeline coverage
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Per year</p>
            <p className="text-2xl font-bold text-primary">{formatSGD(stats.pipelineFor1MYear)}</p>
            <p className="text-[10px] text-muted-foreground">
              Based on {stats.winRate.toFixed(1)}% win rate — need {(12 / (stats.winRate / 100)).toFixed(1)}x pipeline coverage
            </p>
          </div>
        </div>
        {stats.winRate < 20 && (
          <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-3">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>Win rate is below 20% — focus on qualifying leads earlier to improve conversion.</span>
          </div>
        )}
      </div>

      {/* Stage Funnel */}
      <div className="data-panel space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Stage breakdown</h2>
        </div>
        <div className="space-y-2">
          {stats.stageBreakdown.map(({ stage, count, value }) => (
            <div key={stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground w-24">{stage.replace('_', ' ')}</span>
                <span className="text-muted-foreground">{count} deals</span>
                <span className="sgd-value font-medium">{formatSGD(value)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stage === 'won' ? 'bg-green-500' :
                    stage === 'lost' ? 'bg-red-400' :
                    stage === 'on_hold' ? 'bg-amber-400' :
                    'bg-primary'
                  }`}
                  style={{ width: maxStageValue > 0 ? `${(value / maxStageValue) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owner leaderboard */}
      <div className="data-panel">
        <h2 className="text-sm font-semibold mb-3">Performance by owner</h2>
        <table className="w-full table-compact">
          <thead>
            <tr>
              <th className="text-left">Owner</th>
              <th className="text-center">Total Deals</th>
              <th className="text-center">Win Rate</th>
              <th className="text-right">Won Value</th>
            </tr>
          </thead>
          <tbody>
            {stats.ownerStats.map(o => (
              <tr key={o.name}>
                <td className="font-medium">{o.name}</td>
                <td className="text-center text-muted-foreground">{o.totalDeals}</td>
                <td className="text-center">
                  <span className={`text-xs font-medium ${o.winRate >= 50 ? 'text-green-400' : o.winRate >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {o.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="text-right sgd-value">{formatSGD(o.wonValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}