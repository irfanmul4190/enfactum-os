import { useMemo } from "react";
import { KPICard } from "@/components/KPICard";
import { MonthlyComparisonChart, AccountBreakdownChart, CumulativeRevenueChart, RevenueTypeChart, SeasonalityChart } from "@/components/Charts";
import { ForecastPanel } from "@/components/ForecastPanel";
import { AgingHeatMap } from "@/components/AgingHeatMap";
import { AccountHealthScores } from "@/components/AccountHealthScores";
import { DollarSign, TrendingUp, FileText, Target, Globe } from "lucide-react";
import { formatNumber, fy2025Monthly } from "@/data/invoiceData";
import { useInvoices } from "@/contexts/InvoiceContext";
import { useActiveLeadNames } from "@/hooks/useAccounts";
import { currentFY } from "@/lib/fiscalYear";

// Lead names are now sourced from Supabase; initial is derived for the
// avatar placeholder. The hardcoded LEAD_DEFS array (with real names) was
// removed 2026-05-19.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Dashboard() {
  const { invoices, isLive } = useInvoices();
  const leadNames = useActiveLeadNames();
  const fy = currentFY();

  const {
    fy25Total, target, progress, ytdMonths, avgMonthly, projected, yoy,
    latestMonthLabel, latestMonthTotal, momChange,
    countryTotals, accountLeadSummary,
  } = useMemo(() => {
    const allFY25 = invoices.filter(i => i.fiscalYear === fy);

    const leadTotals = allFY25.reduce<Record<string, number>>((acc, inv) => {
      acc[inv.accountLead] = (acc[inv.accountLead] ?? 0) + inv.totalBillingSGD;
      return acc;
    }, {});

    const fy25Total = Math.round(Object.values(leadTotals).reduce((s, v) => s + v, 0));
    // FY24 baseline and FY25 target should come from a configurable source
    // (Supabase targets table or app settings) — hardcoded values previously
    // here leaked real revenue. Zero defaults render an empty YoY / progress
    // until the targets feature is wired.
    const fy24Total = 0;
    const target = 0;
    const progress = target > 0 ? (fy25Total / target) * 100 : 0;

    // For monthly breakdown, use fy2025Monthly if not live, or compute from invoices
    const monthlyData = isLive ? computeMonthlyFromInvoices(allFY25) : fy2025Monthly;
    const ytdMonths = monthlyData.filter(m => m.totalSGD > 0).length || 1;
    const avgMonthly = fy25Total / ytdMonths;
    const projected = avgMonthly * 12;
    const yoy = ((fy25Total - fy24Total) / fy24Total) * 100;

    // Latest & prev month
    const nonZeroMonths = monthlyData.filter(m => m.totalSGD > 0);
    const latestMonth = nonZeroMonths[nonZeroMonths.length - 1];
    const prevMonth = nonZeroMonths.length >= 2 ? nonZeroMonths[nonZeroMonths.length - 2] : null;
    const momChange = latestMonth && prevMonth ? ((latestMonth.totalSGD - prevMonth.totalSGD) / prevMonth.totalSGD) * 100 : 0;

    // Geography
    const countryTotals = allFY25.reduce<Record<string, number>>((acc, inv) => {
      const country = inv.country ?? "Singapore";
      acc[country] = (acc[country] ?? 0) + inv.totalBillingSGD;
      return acc;
    }, {});

    const accountLeadSummary = leadNames.map(name => ({
      name,
      initials: initialsOf(name),
      amount: Math.round(leadTotals[name] ?? 0),
      pct: fy25Total > 0 ? +((leadTotals[name] ?? 0) / fy25Total * 100).toFixed(1) : 0,
    }));

    return {
      fy25Total, target, progress, ytdMonths, avgMonthly, projected, yoy,
      latestMonthLabel: latestMonth?.label ?? "N/A",
      latestMonthTotal: latestMonth?.totalSGD ?? 0,
      momChange,
      countryTotals,
      accountLeadSummary,
    };
  }, [invoices, isLive]);

  const geoSGD  = Math.round(countryTotals["Singapore"] ?? 0);
  const geoMY   = Math.round(countryTotals["Malaysia"]  ?? 0);
  const geoIN   = Math.round(countryTotals["India"]     ?? 0);
  const geoID   = Math.round(countryTotals["Indonesia"] ?? 0);
  const geoOther = Math.round(
    Object.entries(countryTotals)
      .filter(([k]) => !["Singapore","Malaysia","India","Indonesia"].includes(k))
      .reduce((s, [, v]) => s + v, 0)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Revenue Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          Enfactum · {fy} · All figures in SGD
          {isLive && <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "hsl(var(--positive) / 0.15)", color: "hsl(var(--positive))" }}>● Live</span>}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title={`${fy} Revenue YTD`}
          value={`SGD ${formatNumber(fy25Total)}`}
          subtitle={`${ytdMonths} months recorded`}
          change={yoy}
          changeLabel={`vs FY${parseInt(fy.slice(2), 10) - 1}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="blue"
          highlight
        />
        <KPICard
          title="Annual Target Progress"
          value={`${progress.toFixed(1)}%`}
          subtitle={`SGD ${formatNumber(target - fy25Total)} remaining`}
          icon={<Target className="w-4 h-4" />}
          color="green"
        />
        <KPICard
          title={`Latest Month (${latestMonthLabel})`}
          value={`SGD ${formatNumber(latestMonthTotal)}`}
          change={momChange}
          changeLabel="MoM"
          icon={<TrendingUp className="w-4 h-4" />}
          color="amber"
        />
        <KPICard
          title="Avg Monthly Run Rate"
          value={`SGD ${formatNumber(avgMonthly)}`}
          subtitle={`Projected FY25: SGD ${formatNumber(projected)}`}
          icon={<FileText className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* Target Progress Bar */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{fy} Target: SGD 5,000,000</h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Achieved SGD {formatNumber(fy25Total)} · {(100 - progress).toFixed(1)}% remaining
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold mono" style={{ color: "hsl(var(--primary))" }}>{progress.toFixed(1)}%</div>
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>achieved</div>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "var(--gradient-primary)" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>SGD 0</span>
          <span>SGD 2.5M</span>
          <span>SGD 5M</span>
        </div>
      </div>

      {/* Forecast + Aging side-by-side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ForecastPanel />
        </div>
        <AgingHeatMap />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyComparisonChart />
        <AccountBreakdownChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <CumulativeRevenueChart />
        </div>
        <RevenueTypeChart />
      </div>

      {/* Seasonality */}
      <SeasonalityChart />

      {/* Account Health Scores */}
      <AccountHealthScores />

      {/* Account Lead Summary */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenue by Account Lead — {fy} YTD</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {accountLeadSummary.map((lead) => (
            <div key={lead.name} className="rounded-lg p-3 border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                  {lead.initials}
                </div>
                <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{lead.name}</span>
              </div>
              <div className="mono text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>SGD {formatNumber(lead.amount)}</div>
              <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{lead.pct}% of total</div>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                <div className="h-full rounded-full" style={{ width: `${lead.pct}%`, background: "hsl(var(--primary))" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geography Summary */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenue by Geography — {fy} YTD</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { name: "Singapore", amount: geoSGD  },
            { name: "Malaysia",  amount: geoMY   },
            { name: "India",     amount: geoIN   },
            { name: "Indonesia", amount: geoID   },
            { name: "Others",    amount: geoOther },
          ].map((geo) => ({
            ...geo,
            pct: fy25Total > 0 ? +(geo.amount / fy25Total * 100).toFixed(2) : 0,
          })).map((geo) => (
            <div key={geo.name} className="text-center rounded-lg p-3 border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
              <Globe className="w-4 h-4 mx-auto mb-2" style={{ color: "hsl(var(--chart-2))" }} />
              <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>{geo.name}</div>
              <div className="mono text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>{geo.pct}%</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>SGD {formatNumber(geo.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compute monthly aggregates from invoice-level data */
function computeMonthlyFromInvoices(invoices: import("@/data/invoiceData").Invoice[]) {
  const byMonth: Record<string, number> = {};
  invoices.forEach(inv => {
    byMonth[inv.month] = (byMonth[inv.month] ?? 0) + inv.totalBillingSGD;
  });
  return Object.entries(byMonth)
    .map(([label, totalSGD]) => ({
      month: label.split("-")[0],
      year: `20${label.split("-")[1]}`,
      label,
      totalSGD,
      byAccount: {} as Record<string, number>,
      byLead: {} as Record<string, number>,
      invoices: [] as import("@/data/invoiceData").Invoice[],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default Dashboard;
