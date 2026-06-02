import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { fmtMoney as fmtCurrency, fmtPercent } from "@/lib/formatters";
import { filterByDateRange, aggregateRawTotals, calculateGrossMarginPct } from "@/lib/financials";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, Briefcase, DollarSign, BarChart3, PieChart as PieIcon, Clock, Layers, CalendarIcon, X, Wallet, UserCheck } from "lucide-react";
import { ErrorBoundary } from "@repo/ui/error-boundary";
import { ProfitabilityTab } from "@/components/analytics/ProfitabilityTab";
import { RevenueMarginTab } from "@/components/analytics/RevenueMarginTab";
import { CostBreakdownTab } from "@/components/analytics/CostBreakdownTab";
import { UtilizationTab } from "@/components/analytics/UtilizationTab";
import { BusinessMixTab } from "@/components/analytics/BusinessMixTab";
import { PartnerReportsTab } from "@/components/analytics/PartnerReportsTab";
import { CashflowTimelineTab } from "@/components/analytics/CashflowTimelineTab";
import { SalespersonPnLTab } from "@/components/analytics/SalespersonPnLTab";

type TabKey = "profitability" | "trends" | "costs" | "utilization" | "partners" | "business_mix" | "cashflow" | "sales_pnl";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profitability", label: "Profitability", icon: BarChart3 },
  { key: "trends", label: "Revenue & Margin", icon: TrendingUp },
  { key: "costs", label: "Cost Breakdown", icon: PieIcon },
  { key: "utilization", label: "Utilization", icon: Clock },
  { key: "business_mix", label: "Business Mix", icon: Layers },
  { key: "partners", label: "Partner Reports", icon: Users },
  { key: "cashflow", label: "Cashflow", icon: Wallet },
  { key: "sales_pnl", label: "Sales P&L", icon: UserCheck },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profitability");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const allData = useAllProjectFinancials();
  const clearDates = useCallback(() => { setDateFrom(undefined); setDateTo(undefined); }, []);

  // Filter projects by date range — uses shared helper
  const data = useMemo(() => filterByDateRange(allData, dateFrom, dateTo), [allData, dateFrom, dateTo]);

  // Aggregate KPIs — uses shared aggregation (no currency conversion needed here)
  const totals = useMemo(() => aggregateRawTotals(data), [data]);

  const gmPct = calculateGrossMarginPct(totals.revenue, totals.grossMargin);
  const netPct = calculateGrossMarginPct(totals.revenue, totals.netMargin);

  const kpis = [
    { label: "Total Revenue", value: fmtCurrency(totals.revenue), icon: DollarSign, color: "hsl(var(--primary))" },
    { label: "Gross Margin", value: fmtCurrency(totals.grossMargin), icon: TrendingUp, sub: fmtPercent(gmPct), color: "hsl(var(--positive))" },
    { label: "Total Payouts", value: fmtCurrency(totals.totalPayouts), icon: Users, color: "hsl(var(--warning))" },
    { label: "Net Margin", value: fmtCurrency(totals.netMargin), icon: Briefcase, sub: fmtPercent(netPct), color: "hsl(var(--chart-4))" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Portfolio-wide profitability, cost, and utilization insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">–</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDates} className="h-8 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: k.color }} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.color + "18", color: k.color }}>
                <k.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold tabular-nums mono">{k.value}</div>
            {k.sub && <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profitability" && (
        <ErrorBoundary fallbackTitle="Failed to load Profitability tab">
          <ProfitabilityTab data={data} />
        </ErrorBoundary>
      )}

      {activeTab === "trends" && (
        <ErrorBoundary fallbackTitle="Failed to load Trends tab">
          <RevenueMarginTab data={data} />
        </ErrorBoundary>
      )}

      {activeTab === "costs" && (
        <ErrorBoundary fallbackTitle="Failed to load Costs tab">
          <CostBreakdownTab data={data} totals={totals} />
        </ErrorBoundary>
      )}

      {activeTab === "utilization" && (
        <ErrorBoundary fallbackTitle="Failed to load Utilization tab">
          <UtilizationTab totalInternalCost={totals.internalCost} />
        </ErrorBoundary>
      )}

      {activeTab === "business_mix" && (
        <ErrorBoundary fallbackTitle="Failed to load Business Mix tab">
          <BusinessMixTab data={data} />
        </ErrorBoundary>
      )}

      {activeTab === "partners" && (
        <ErrorBoundary fallbackTitle="Failed to load Partners tab">
          <PartnerReportsTab data={data} />
        </ErrorBoundary>
      )}

      {activeTab === "cashflow" && (
        <ErrorBoundary fallbackTitle="Failed to load Cashflow tab">
          <CashflowTimelineTab data={data} />
        </ErrorBoundary>
      )}

      {activeTab === "sales_pnl" && (
        <ErrorBoundary fallbackTitle="Failed to load Sales P&L tab">
          <SalespersonPnLTab data={data} />
        </ErrorBoundary>
      )}
    </div>
  );
}
