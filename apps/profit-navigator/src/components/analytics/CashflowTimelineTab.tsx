import { useMemo, useState, useCallback } from "react";
import { format, parseISO, startOfMonth, isBefore, isAfter } from "date-fns";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { useDataStore } from "@/hooks/useDataStore";
import { fmtMoney, fmtNumber } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CalendarIcon, X, Filter, TrendingUp, Download } from "lucide-react";
import { generateCashflowForecast } from "@/lib/cashflowForecast";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";

interface CashflowTimelineTabProps {
  data: ProjectWithFinancials[];
}

interface CashflowEntry {
  date: string;
  type: "inflow" | "outflow";
  description: string;
  projectName: string;
  projectId: string;
  amount: number;
}

export function CashflowTimelineTab({ data }: CashflowTimelineTabProps) {
  const { invoices, vendorCosts } = useDataStore();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showForecast, setShowForecast] = useState(true);
  const clearDates = useCallback(() => { setDateFrom(undefined); setDateTo(undefined); }, []);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.forEach(d => { map[d.project.project_id] = d.project.project_name; });
    return map;
  }, [data]);

  const projectIds = useMemo(() => data.map(d => d.project.project_id), [data]);

  const toggleProject = useCallback((pid: string) => {
    setSelectedProjects(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  }, []);

  // Build raw cashflow entries
  const entries = useMemo(() => {
    const items: CashflowEntry[] = [];
    const activeProjects = selectedProjects.length > 0 ? selectedProjects : projectIds;

    invoices.forEach(inv => {
      if (!activeProjects.includes(inv.project_id)) return;
      items.push({
        date: inv.invoice_date,
        type: "inflow",
        description: `Invoice ${inv.invoice_no}`,
        projectName: projectMap[inv.project_id] || "Unknown",
        projectId: inv.project_id,
        amount: inv.amount_ex_tax,
      });
    });

    vendorCosts.forEach(vc => {
      if (!activeProjects.includes(vc.project_id)) return;
      const date = vc.invoice_date || "2025-01-01";
      items.push({
        date,
        type: "outflow",
        description: `Vendor: ${vc.cost_category}`,
        projectName: projectMap[vc.project_id] || "Unknown",
        projectId: vc.project_id,
        amount: vc.actual_amount,
      });
    });

    data.forEach(d => {
      if (!activeProjects.includes(d.project.project_id)) return;
      d.financials.payouts.forEach(p => {
        if (p.final_amount <= 0) return;
        items.push({
          date: d.project.end_date || "2025-06-01",
          type: "outflow",
          description: `Payout: ${p.stakeholder_name} (${p.role_on_project})`,
          projectName: d.project.project_name,
          projectId: d.project.project_id,
          amount: p.final_amount,
        });
      });
    });

    return items
      .filter(item => {
        const d = parseISO(item.date);
        if (dateFrom && isBefore(d, dateFrom)) return false;
        if (dateTo && isAfter(d, dateTo)) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [invoices, vendorCosts, data, projectIds, selectedProjects, projectMap, dateFrom, dateTo]);

  // Forecast data
  const forecastData = useMemo(() => {
    if (!showForecast) return [];
    const activeData = selectedProjects.length > 0
      ? data.filter(d => selectedProjects.includes(d.project.project_id))
      : data;
    const activeInvoices = selectedProjects.length > 0
      ? invoices.filter(i => selectedProjects.includes(i.project_id))
      : invoices;
    const activeVendorCosts = selectedProjects.length > 0
      ? vendorCosts.filter(v => selectedProjects.includes(v.project_id))
      : vendorCosts;
    return generateCashflowForecast(activeData, activeInvoices, activeVendorCosts, 3);
  }, [showForecast, data, invoices, vendorCosts, selectedProjects]);

  // Monthly aggregation for chart (actuals + forecast)
  const chartData = useMemo(() => {
    const monthMap: Record<string, { inflows: number; outflows: number }> = {};
    entries.forEach(e => {
      const monthKey = format(startOfMonth(parseISO(e.date)), "yyyy-MM");
      if (!monthMap[monthKey]) monthMap[monthKey] = { inflows: 0, outflows: 0 };
      if (e.type === "inflow") monthMap[monthKey].inflows += e.amount;
      else monthMap[monthKey].outflows += e.amount;
    });

    const months = Object.keys(monthMap).sort();
    let cumulative = 0;

    const actualPoints = months.map(m => {
      const net = monthMap[m].inflows - monthMap[m].outflows;
      cumulative += net;
      return {
        month: format(parseISO(m + "-01"), "MMM yyyy"),
        inflows: monthMap[m].inflows,
        outflows: -monthMap[m].outflows,
        forecastInflows: 0,
        forecastOutflows: 0,
        cumulative,
        isForecast: false,
      };
    });

    // Append forecast months
    const forecastPoints = forecastData.map(fm => {
      const net = fm.forecastInflows - fm.forecastOutflows;
      cumulative += net;
      return {
        month: fm.label,
        inflows: 0,
        outflows: 0,
        forecastInflows: fm.forecastInflows,
        forecastOutflows: -fm.forecastOutflows,
        cumulative,
        isForecast: true,
      };
    });

    return [...actualPoints, ...forecastPoints];
  }, [entries, forecastData]);

  // Detailed table with running balance
  const tableRows = useMemo(() => {
    let balance = 0;
    const actual = entries.map((e, i) => {
      const signedAmount = e.type === "inflow" ? e.amount : -e.amount;
      balance += signedAmount;
      return { ...e, signedAmount, runningBalance: balance, key: `${e.date}-${i}`, isForecast: false };
    });

    // Add forecast entries to table
    const forecast = forecastData.flatMap((fm, fi) => {
      const rows: typeof actual = [];
      if (fm.forecastInflows > 0) {
        balance += fm.forecastInflows;
        rows.push({
          date: fm.monthKey + "-15",
          type: "inflow" as const,
          description: "Forecast: Contracted revenue",
          projectName: "Multiple",
          projectId: "",
          amount: fm.forecastInflows,
          signedAmount: fm.forecastInflows,
          runningBalance: balance,
          key: `fc-in-${fi}`,
          isForecast: true,
        });
      }
      if (fm.forecastOutflows > 0) {
        balance -= fm.forecastOutflows;
        rows.push({
          date: fm.monthKey + "-15",
          type: "outflow" as const,
          description: "Forecast: Projected vendor costs",
          projectName: "Multiple",
          projectId: "",
          amount: fm.forecastOutflows,
          signedAmount: -fm.forecastOutflows,
          runningBalance: balance,
          key: `fc-out-${fi}`,
          isForecast: true,
        });
      }
      return rows;
    });

    return [...actual, ...forecast];
  }, [entries, forecastData]);

  // Forecast summary KPIs
  const forecastSummary = useMemo(() => {
    if (forecastData.length === 0) return null;
    const totalIn = forecastData.reduce((s, f) => s + f.forecastInflows, 0);
    const totalOut = forecastData.reduce((s, f) => s + f.forecastOutflows, 0);
    return { totalIn, totalOut, net: totalIn - totalOut, months: forecastData.length };
  }, [forecastData]);

  const exportCSV = useCallback(() => {
    const headers = ["Date", "Type", "Description", "Project", "Amount", "Running Balance", "Forecast"];
    const rows = tableRows.map(r => [
      r.date,
      r.type === "inflow" ? "Inflow" : "Outflow",
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.projectName.replace(/"/g, '""')}"`,
      r.signedAmount.toFixed(2),
      r.runningBalance.toFixed(2),
      r.isForecast ? "Yes" : "No",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-detail-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tableRows]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDates} className="h-8 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {data.map(d => (
            <button
              key={d.project.project_id}
              onClick={() => toggleProject(d.project.project_id)}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                (selectedProjects.length === 0 || selectedProjects.includes(d.project.project_id))
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {d.project.project_code}
            </button>
          ))}
          {selectedProjects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedProjects([])} className="h-6 px-1.5 text-xs">
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Forecast</span>
          <Switch checked={showForecast} onCheckedChange={setShowForecast} />
        </div>
      </div>

      {/* Forecast Summary KPIs */}
      {showForecast && forecastSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="kpi-card">
            <span className="text-xs font-medium text-muted-foreground">Forecast Period</span>
            <div className="text-lg font-bold tabular-nums mono">{forecastSummary.months} months</div>
          </div>
          <div className="kpi-card">
            <span className="text-xs font-medium text-muted-foreground">Expected Inflows</span>
            <div className="text-lg font-bold tabular-nums mono text-[hsl(var(--positive))]">
              {fmtMoney(forecastSummary.totalIn)}
            </div>
          </div>
          <div className="kpi-card">
            <span className="text-xs font-medium text-muted-foreground">Projected Outflows</span>
            <div className="text-lg font-bold tabular-nums mono text-[hsl(var(--negative))]">
              {fmtMoney(forecastSummary.totalOut)}
            </div>
          </div>
          <div className="kpi-card">
            <span className="text-xs font-medium text-muted-foreground">Net Cashflow</span>
            <div className={cn(
              "text-lg font-bold tabular-nums mono",
              forecastSummary.net >= 0 ? "text-[hsl(var(--positive))]" : "text-[hsl(var(--negative))]"
            )}>
              {fmtMoney(forecastSummary.net)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4">
          Monthly Cashflow
          {showForecast && forecastData.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (dashed area = forecast)
            </span>
          )}
        </h3>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No cashflow data for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => fmtNumber(v)} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (value === 0) return [null, null];
                  return [fmtMoney(Math.abs(value)), name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Actuals */}
              <Bar dataKey="inflows" name="Inflows" fill="hsl(var(--positive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflows" name="Outflows" fill="hsl(var(--negative))" radius={[0, 0, 4, 4]} />
              {/* Forecast */}
              <Bar dataKey="forecastInflows" name="Forecast Inflows" fill="hsl(var(--positive))" radius={[4, 4, 0, 0]} fillOpacity={0.35} strokeDasharray="4 2" stroke="hsl(var(--positive))" />
              <Bar dataKey="forecastOutflows" name="Forecast Outflows" fill="hsl(var(--negative))" radius={[0, 0, 4, 4]} fillOpacity={0.35} strokeDasharray="4 2" stroke="hsl(var(--negative))" />
              {/* Cumulative line */}
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Position"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
              />
              {/* Zero reference */}
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeOpacity={0.5} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detail Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
          <div>
            <h3 className="text-sm font-semibold">Cashflow Detail</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tableRows.length} transactions{showForecast && forecastData.length > 0 && " (incl. forecast)"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={tableRows.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Project</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(row => {
                const isNegativeBalance = row.runningBalance < 0;
                return (
                  <tr
                    key={row.key}
                    className={cn(
                      isNegativeBalance && "bg-[hsl(var(--warning)/0.12)]",
                      row.isForecast && "opacity-60"
                    )}
                  >
                    <td className="tabular-nums">{row.date}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            row.type === "inflow"
                              ? "border-[hsl(var(--positive))] text-[hsl(var(--positive))]"
                              : "border-[hsl(var(--negative))] text-[hsl(var(--negative))]"
                          )}
                        >
                          {row.type === "inflow" ? "Inflow" : "Outflow"}
                        </Badge>
                        {row.isForecast && (
                          <Badge variant="outline" className="text-[10px] border-[hsl(var(--primary))] text-[hsl(var(--primary))]">
                            Forecast
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-sm">{row.description}</td>
                    <td className="text-muted-foreground text-xs">{row.projectName}</td>
                    <td className={cn(
                      "text-right tabular-nums mono font-medium",
                      row.type === "inflow" ? "text-[hsl(var(--positive))]" : "text-[hsl(var(--negative))]"
                    )}>
                      {row.type === "inflow" ? "+" : "−"}{fmtMoney(row.amount)}
                    </td>
                    <td className={cn(
                      "text-right tabular-nums mono font-bold",
                      isNegativeBalance && "text-[hsl(var(--negative))]"
                    )}>
                      {fmtMoney(row.runningBalance)}
                    </td>
                  </tr>
                );
              })}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
