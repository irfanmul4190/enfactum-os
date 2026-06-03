import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KPICard } from '@/components/KPICard';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { StageBadge } from '@/components/StatusBadges';
import { formatSGD } from '@/lib/format';
import { useDeals } from '@/hooks/useDeals';
import { useRecentEvents, useAllEvents, type DbEvent } from '@/hooks/useEvents';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployee } from '@/contexts/EmployeeContext';
import { usePerms } from '@/hooks/usePerms';
import { STAGES_ORDERED } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, parseISO, subMonths, startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns';
import { DashboardDateFilter, getDefaultDateRange, type DateRange } from '@/components/DashboardDateFilter';
import { generateBoardPackPdf } from '@/lib/boardPackPdf';
import {
  DollarSign, TrendingUp, Trophy, XCircle, BarChart3, Tag,
  Plus, Activity, AlertTriangle, Clock, FileDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Helpers ───

function getMonthRange(offset: number) {
  const d = subMonths(new Date(), offset);
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

function inMonth(dateStr: string | null | undefined, offset: number): boolean {
  if (!dateStr) return false;
  const { start, end } = getMonthRange(offset);
  try {
    return isWithinInterval(parseISO(dateStr), { start, end });
  } catch { return false; }
}

const FUNNEL_STAGES = ['Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed'] as const;
const FUNNEL_COLORS = ['hsl(210, 100%, 56%)', 'hsl(200, 80%, 50%)', 'hsl(170, 70%, 45%)', 'hsl(140, 65%, 42%)', 'hsl(152, 60%, 45%)'];

// ─── Dashboard ───

export default function Dashboard() {
  const { employee } = useEmployee();
  const { canEdit: canWrite } = usePerms();
  const { data: allDeals = [], isLoading: dealsLoading } = useDeals();
  const { data: recentEvents = [] } = useRecentEvents('enflow', 15);
  const { data: allEvents = [] } = useAllEvents();
  const { data: employees = [] } = useEmployees();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [createOpen, setCreateOpen] = useState(false);

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  // Filter deals by date range (using deal created or updated date)
  const deals = useMemo(() => {
    return allDeals.filter(d => {
      const dateStr = d.actual_close_date ?? d.deal_updated_at ?? d.deal_created_at;
      if (!dateStr) return true; // include deals without dates
      try {
        return isWithinInterval(parseISO(dateStr), { start: dateRange.from, end: dateRange.to });
      } catch {
        return true;
      }
    });
  }, [allDeals, dateRange]);

  // ─── KPI Calculations ───
  const kpis = useMemo(() => {
    const openDeals = deals.filter(d => d.stage && !['Closed', 'Lost', 'Won'].includes(d.stage));
    const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
    const weightedPipeline = openDeals.reduce((s, d) => s + (d.value ?? 0) * (d.win_probability ?? 0), 0);

    // Won this month
    const wonThisMonth = deals.filter(d =>
      (d.stage === 'Closed' || d.stage === 'Won') && inMonth(d.actual_close_date ?? d.deal_updated_at, 0)
    );
    const wonLastMonth = deals.filter(d =>
      (d.stage === 'Closed' || d.stage === 'Won') && inMonth(d.actual_close_date ?? d.deal_updated_at, 1)
    );
    const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + (d.value ?? 0), 0);
    const wonLastMonthValue = wonLastMonth.reduce((s, d) => s + (d.value ?? 0), 0);

    // Lost this month
    const lostThisMonth = deals.filter(d =>
      d.stage === 'Lost' && inMonth(d.actual_close_date ?? d.deal_updated_at, 0)
    );
    const lostLastMonth = deals.filter(d =>
      d.stage === 'Lost' && inMonth(d.actual_close_date ?? d.deal_updated_at, 1)
    );
    const lostThisMonthValue = lostThisMonth.reduce((s, d) => s + (d.value ?? 0), 0);

    // Avg deal size (won, last 90 days)
    const cutoff90 = subDays(new Date(), 90);
    const recentWon = deals.filter(d => {
      if (d.stage !== 'Closed' && d.stage !== 'Won') return false;
      const closeDate = d.actual_close_date ?? d.deal_updated_at;
      if (!closeDate) return false;
      try { return parseISO(closeDate) >= cutoff90; } catch { return false; }
    });
    const avgDealSize = recentWon.length > 0
      ? recentWon.reduce((s, d) => s + (d.value ?? 0), 0) / recentWon.length
      : 0;

    // Avg margin
    const dealsWithMargin = deals.filter(d => d.margin_gp_percent != null || d.gp_percent != null);
    const avgMargin = dealsWithMargin.length > 0
      ? dealsWithMargin.reduce((s, d) => s + (d.margin_gp_percent ?? d.gp_percent ?? 0), 0) / dealsWithMargin.length
      : 0;

    // Previous month pipeline for comparison
    const prevOpenDeals = deals.filter(d => d.stage && !['Closed', 'Lost', 'Won'].includes(d.stage));
    const prevPipelineChange = wonLastMonthValue > 0 ? ((pipelineValue - wonLastMonthValue) / wonLastMonthValue * 100) : 0;

    return {
      pipelineValue,
      weightedPipeline,
      wonThisMonth,
      wonThisMonthValue,
      wonLastMonthValue,
      lostThisMonth,
      lostThisMonthValue,
      lostLastMonthCount: lostLastMonth.length,
      avgDealSize,
      avgMargin,
      dealsWithMargin: dealsWithMargin.length,
      openDeals,
    };
  }, [deals]);

  // ─── Funnel Data ───
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES.map((stage, i) => {
      const stageDeals = deals.filter(d => {
        if (stage === 'Closed') return d.stage === 'Closed' || d.stage === 'Won';
        return d.stage === stage;
      });
      const count = stageDeals.length;
      const value = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
      return { stage: stage === 'Closed' ? 'Won' : stage, count, value, color: FUNNEL_COLORS[i] };
    });
  }, [deals]);

  const funnelWithConversion = useMemo(() => {
    return funnelData.map((item, i) => ({
      ...item,
      conversion: i < funnelData.length - 1 && funnelData[i].count > 0
        ? Math.round((funnelData[i + 1].count / funnelData[i].count) * 100)
        : null,
    }));
  }, [funnelData]);

  // ─── Win Rate by Month (last 6 months) ───
  const winRateByMonth = useMemo(() => {
    const months: { label: string; winRate: number; won: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const { start, end } = getMonthRange(i);
      const label = start.toLocaleDateString('en', { month: 'short' });
      const closedInMonth = deals.filter(d => {
        const cd = d.actual_close_date ?? d.deal_updated_at;
        if (!cd) return false;
        if (d.stage !== 'Closed' && d.stage !== 'Won' && d.stage !== 'Lost') return false;
        try { return isWithinInterval(parseISO(cd), { start, end }); } catch { return false; }
      });
      const won = closedInMonth.filter(d => d.stage === 'Closed' || d.stage === 'Won').length;
      const total = closedInMonth.length;
      months.push({ label, winRate: total > 0 ? Math.round((won / total) * 100) : 0, won, total });
    }
    return months;
  }, [deals]);

  // ─── Loss Reasons ───
  const lossReasons = useMemo(() => {
    const reasons: Record<string, number> = {};
    allEvents
      .filter(e => e.event_type === 'deal.lost')
      .forEach(e => {
        const reason = (e.payload as any)?.loss_reason || 'Unknown';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allEvents]);

  // ─── MDF Tracker ───
  const mdfStats = useMemo(() => {
    const mdfDeals = deals.filter(d => d.mdf_eligible && d.stage && !['Lost'].includes(d.stage));
    const estimatedMdf = mdfDeals.reduce((s, d) => s + (d.mdf_amount ?? 0), 0);
    // Avg MDF-adjusted GP%: (gross_profit + mdf_amount) / revenue * 100
    const dealsWithRevenue = mdfDeals.filter(d => (d.margin_revenue ?? 0) > 0);
    const avgMdfAdjustedGp = dealsWithRevenue.length > 0
      ? dealsWithRevenue.reduce((s, d) => {
          const gp = d.gross_profit ?? d.margin_gp ?? 0;
          const mdf = d.mdf_amount ?? 0;
          const rev = d.margin_revenue ?? 1;
          return s + ((gp + mdf) / rev) * 100;
        }, 0) / dealsWithRevenue.length
      : null;
    return {
      count: mdfDeals.length,
      pipelineValue: mdfDeals.reduce((s, d) => s + (d.value ?? 0), 0),
      estimatedMdf,
      avgMdfAdjustedGp,
      dealsWithRevenue: dealsWithRevenue.length,
    };
  }, [deals]);

  // ─── Stale Deals ───
  const staleDeals = useMemo(() => {
    const now = new Date();
    const cutoff14 = subDays(now, 14);

    // Build map of latest stage change event per deal
    const lastActivityMap = new Map<string, Date>();
    allEvents
      .filter(e => e.entity_type === 'deal' && e.occurred_at)
      .forEach(e => {
        const existing = lastActivityMap.get(e.entity_id!);
        const d = parseISO(e.occurred_at!);
        if (!existing || d > existing) lastActivityMap.set(e.entity_id!, d);
      });

    return deals
      .filter(d => d.stage && !['Closed', 'Won', 'Lost'].includes(d.stage))
      .map(d => {
        const lastActivity = lastActivityMap.get(d.id) ?? (d.deal_updated_at ? parseISO(d.deal_updated_at) : null);
        const daysSince = lastActivity ? Math.round((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        return { ...d, daysSinceActivity: daysSince };
      })
      .filter(d => d.daysSinceActivity >= 14)
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
  }, [deals, allEvents]);

  if (dealsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxFunnelCount = Math.max(...funnelData.map(f => f.count), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <span className="text-xs text-muted-foreground">en·Flow</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {employee?.name || 'User'}</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardDateFilter value={dateRange} onChange={setDateRange} />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => {
              const topDeals = [...deals]
                .filter(d => d.stage && !['Lost'].includes(d.stage))
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                .slice(0, 15)
                .map(d => ({
                  title: d.title || 'Untitled',
                  account_name: d.account_name || '—',
                  stage: d.stage || '—',
                  value: d.value ?? 0,
                  owner_name: d.owner_name || '—',
                  win_probability: d.win_probability ?? 0,
                }));

              generateBoardPackPdf({
                kpis: {
                  pipelineValue: kpis.pipelineValue,
                  weightedPipeline: kpis.weightedPipeline,
                  wonThisMonthCount: kpis.wonThisMonth.length,
                  wonThisMonthValue: kpis.wonThisMonthValue,
                  lostThisMonthCount: kpis.lostThisMonth.length,
                  lostThisMonthValue: kpis.lostThisMonthValue,
                  avgDealSize: kpis.avgDealSize,
                  avgMargin: kpis.avgMargin,
                },
                funnel: funnelWithConversion,
                topDeals,
                mdfStats: { count: mdfStats.count, pipelineValue: mdfStats.pipelineValue, estimatedMdf: mdfStats.estimatedMdf },
                winRateByMonth,
                lossReasons,
                dateRangeLabel: dateRange.label,
                generatedBy: employee?.name || 'Unknown',
              });
            }}
          >
            <FileDown className="h-3 w-3 mr-1" />Board Pack
          </Button>
          <Button size="sm" className="h-8 text-xs" disabled={!canWrite} onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3 mr-1" />Opportunity</Button>
          <CreateDealDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
      </div>

      {/* KPI Cards — 2 rows of 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard
          label="Pipeline Value"
          value={formatSGD(kpis.pipelineValue)}
          icon={DollarSign}
          accent
          subtitle={`${kpis.openDeals.length} open deals`}
        />
        <KPICard
          label="Weighted Pipeline"
          value={formatSGD(kpis.weightedPipeline)}
          icon={TrendingUp}
          accent
        />
        <KPICard
          label="Deals Won (This Month)"
          value={`${kpis.wonThisMonth.length} · ${formatSGD(kpis.wonThisMonthValue)}`}
          icon={Trophy}
          accent
          change={kpis.wonLastMonthValue > 0
            ? { value: ((kpis.wonThisMonthValue - kpis.wonLastMonthValue) / kpis.wonLastMonthValue) * 100, label: 'vs last month' }
            : null}
        />
        <KPICard
          label="Deals Lost (This Month)"
          value={`${kpis.lostThisMonth.length} · ${formatSGD(kpis.lostThisMonthValue)}`}
          icon={XCircle}
          change={kpis.lostLastMonthCount > 0
            ? { value: ((kpis.lostThisMonth.length - kpis.lostLastMonthCount) / kpis.lostLastMonthCount) * 100, label: 'vs last month' }
            : null}
        />
        <KPICard
          label="Avg Deal Size"
          value={formatSGD(kpis.avgDealSize)}
          icon={BarChart3}
          subtitle="Won deals, last 90 days"
        />
        <KPICard
          label="Avg Margin"
          value={`${kpis.avgMargin.toFixed(1)}%`}
          icon={TrendingUp}
          subtitle={`${kpis.dealsWithMargin} deals with margin data`}
        />
      </div>

      {/* Pipeline Funnel */}
      <div className="data-panel">
        <h2 className="consulting-headline mb-4">Pipeline Funnel</h2>
        <div className="space-y-2">
          {funnelWithConversion.map((item, i) => {
            const widthPct = Math.max((item.count / maxFunnelCount) * 100, 8);
            return (
              <div key={item.stage} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-right shrink-0">{item.stage}</div>
                <div className="flex-1 relative">
                  <div
                    className="h-9 rounded-sm flex items-center px-3 transition-all duration-500"
                    style={{ width: `${widthPct}%`, backgroundColor: item.color, minWidth: 80 }}
                  >
                    <span className="text-xs font-semibold text-white whitespace-nowrap">
                      {item.count} deals · {formatSGD(item.value)}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right shrink-0">
                  {item.conversion != null ? (
                    <span className="text-[11px] text-muted-foreground font-mono">{item.conversion}% →</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Win/Loss Analysis */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Win Rate by Month */}
        <div className="data-panel">
          <h2 className="consulting-headline mb-3">Win Rate by Month</h2>
          {winRateByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={winRateByMonth} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(220, 18%, 13%)', border: '1px solid hsl(220, 12%, 20%)', borderRadius: 6, fontSize: 12 }}
                  formatter={(value: any, name: string) => [`${value}%`, 'Win Rate']}
                  labelStyle={{ color: 'hsl(215, 12%, 55%)' }}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {winRateByMonth.map((entry, i) => (
                    <Cell key={i} fill={entry.winRate >= 50 ? 'hsl(152, 60%, 45%)' : entry.winRate >= 30 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </div>

        {/* Loss Reasons */}
        <div className="data-panel">
          <h2 className="consulting-headline mb-3">Loss Reasons</h2>
          {lossReasons.length > 0 ? (
            <div className="space-y-2">
              {lossReasons.map(({ reason, count }) => {
                const maxCount = lossReasons[0]?.count || 1;
                return (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs truncate">{reason}</span>
                        <span className="text-xs font-mono text-muted-foreground ml-2">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive/70 transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No loss events recorded</p>
          )}
        </div>
      </div>

      {/* MDF Tracker + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* MDF Tracker */}
        <div className="data-panel">
          <h2 className="consulting-headline flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4" />MDF Opportunity Tracker
          </h2>
          <div className="space-y-3">
            <div>
              <p className="section-label">MDF-Eligible Pipeline</p>
              <p className="text-lg font-bold sgd-value mt-0.5">{formatSGD(mdfStats.pipelineValue)}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="section-label">MDF Deals</p>
                <p className="text-sm font-semibold mt-0.5">{mdfStats.count}</p>
              </div>
              <div>
                <p className="section-label">Estimated MDF</p>
                <p className="sgd-value font-semibold mt-0.5 text-sm">{formatSGD(mdfStats.estimatedMdf)}</p>
              </div>
              <div>
                <p className="section-label">Avg MDF-Adj GP%</p>
                <p className={`text-sm font-semibold mt-0.5 ${mdfStats.avgMdfAdjustedGp != null && mdfStats.avgMdfAdjustedGp >= 20 ? 'text-emerald-400' : mdfStats.avgMdfAdjustedGp != null && mdfStats.avgMdfAdjustedGp >= 12 ? 'text-amber-400' : 'text-destructive'}`}>
                  {mdfStats.avgMdfAdjustedGp != null ? `${mdfStats.avgMdfAdjustedGp.toFixed(1)}%` : '—'}
                </p>
                {mdfStats.dealsWithRevenue > 0 && (
                  <p className="text-[10px] text-muted-foreground">{mdfStats.dealsWithRevenue} deals</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="data-panel lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="consulting-headline flex items-center gap-2">
              <Activity className="h-4 w-4" />Recent Activity
            </h2>
            <Badge variant="outline" className="text-[10px]">{recentEvents.length} events</Badge>
          </div>
          <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              recentEvents.map(event => {
                const actorName = event.actor_id ? employeeMap.get(event.actor_id) : null;
                const timeAgo = event.occurred_at
                  ? formatDistanceToNow(parseISO(event.occurred_at), { addSuffix: true })
                  : '';
                const description = getEventDescription(event);

                return (
                  <div key={event.id} className="flex gap-2.5 py-2 px-2.5 rounded hover:bg-muted/30 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${getEventColor(event.event_type)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        {actorName && <span className="font-medium">{actorName} · </span>}
                        <span className="text-foreground/80">{description}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Deals Needing Attention */}
      {staleDeals.length > 0 && (
        <div className="data-panel">
          <div className="flex items-center justify-between mb-3">
            <h2 className="consulting-headline flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Deals Needing Attention
            </h2>
            <Badge variant="destructive" className="text-[10px]">{staleDeals.length} stale</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-compact">
              <thead>
                <tr>
                  <th className="text-left">Title</th>
                  <th className="text-left">Account</th>
                  <th className="text-left">Stage</th>
                  <th className="text-right">Days Stale</th>
                  <th className="text-right">Value</th>
                  <th className="text-left">Owner</th>
                </tr>
              </thead>
              <tbody>
                {staleDeals.map(d => (
                  <tr key={d.id} className={d.daysSinceActivity > 30 ? 'bg-destructive/5' : ''}>
                    <td>
                      <Link to={`/opportunity/${d.id}`} className="text-primary hover:underline text-sm">{d.title}</Link>
                    </td>
                    <td className="text-muted-foreground text-sm">{d.account_name}</td>
                    <td><StageBadge stage={d.stage || 'Unknown'} /></td>
                    <td className="text-right">
                      <Badge
                        variant={d.daysSinceActivity > 30 ? 'destructive' : 'warning'}
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {d.daysSinceActivity}d
                      </Badge>
                    </td>
                    <td className="text-right sgd-value text-sm">{formatSGD(d.value ?? 0)}</td>
                    <td className="text-muted-foreground text-sm">{d.owner_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Event Display Helpers ───

function getEventDescription(event: DbEvent): string {
  const p = (event.payload ?? {}) as Record<string, any>;
  switch (event.event_type) {
    case 'deal.created': return `Created deal "${p.title}"`;
    case 'deal.stage_changed': return `Moved deal from ${p.from} → ${p.to}`;
    case 'deal.won': return `🎉 Deal won — ${p.account_name || ''} (${formatSGD(p.value ?? 0)})`;
    case 'deal.lost': return `Deal lost${p.loss_reason ? ` — ${p.loss_reason}` : ''}`;
    case 'deal.updated': return `Updated deal fields: ${Object.keys(p.changed_fields || {}).join(', ')}`;
    case 'deal.mdf_flagged': return `MDF eligibility flagged`;
    case 'margin.created': return `Margin record created (GP: ${(p.gp_percent ?? 0).toFixed(1)}%)`;
    case 'account.created': return `Created account "${p.name}"`;
    case 'account.updated': return `Updated account: ${Object.keys(p.changed_fields || {}).join(', ')}`;
    default: return event.event_type || 'Unknown event';
  }
}

function getEventColor(eventType: string | null): string {
  switch (eventType) {
    case 'deal.won': return 'bg-emerald-400';
    case 'deal.lost': return 'bg-destructive';
    case 'deal.stage_changed': return 'bg-primary';
    case 'deal.created': return 'bg-primary';
    case 'margin.created': return 'bg-emerald-400';
    case 'deal.mdf_flagged': return 'bg-amber-400';
    default: return 'bg-muted-foreground';
  }
}
