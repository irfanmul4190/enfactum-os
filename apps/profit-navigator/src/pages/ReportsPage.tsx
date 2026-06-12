import { useMemo, useState, useCallback } from "react";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { useDataStore } from "@/hooks/useDataStore";
import { usePnRainmakerFees } from "@/hooks/useSupabaseData";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtPercent, fmtMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Download, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

interface ReportRow {
  accountName: string;
  country: string;
  clientManager: string;
  projectName: string;
  projectCode: string;
  status: string;
  startDate: string;
  endDate: string;
  currency: string;
  estimatedMarginPct: number;
  revenue: number;
  revenueSGD: number;
  vendorCosts: number;
  vendorCostsSGD: number;
  rainmakerFee: number;
  rainmakerFeeSGD: number;
  grossProfit: number;
  grossProfitSGD: number;
  gpPct: number;
  netAfterPayouts: number;
  netAfterPayoutsSGD: number;
}

function exportCSV(rows: ReportRow[]) {
  const headers = [
    "Account", "Country", "Client Manager", "Project", "Code", "Status",
    "Start Date", "End Date", "Currency",
    "Est. Margin %", "Revenue (local)", "Revenue (SG$)",
    "Vendor Costs (local)", "Vendor Costs (SG$)",
    "Rainmaker Fee (local)", "Rainmaker Fee (SG$)",
    "Gross Profit (local)", "Gross Profit (SG$)", "GP%",
    "Net After Payouts (local)", "Net After Payouts (SG$)",
  ];
  const csvRows = [
    headers.join(","),
    ...rows.map(r => [
      `"${r.accountName}"`, `"${r.country}"`, `"${r.clientManager}"`,
      `"${r.projectName}"`, `"${r.projectCode}"`, `"${r.status}"`,
      r.startDate, r.endDate, r.currency,
      r.estimatedMarginPct.toFixed(1),
      r.revenue.toFixed(2), r.revenueSGD.toFixed(2),
      r.vendorCosts.toFixed(2), r.vendorCostsSGD.toFixed(2),
      r.rainmakerFee.toFixed(2), r.rainmakerFeeSGD.toFixed(2),
      r.grossProfit.toFixed(2), r.grossProfitSGD.toFixed(2),
      (r.gpPct * 100).toFixed(1),
      r.netAfterPayouts.toFixed(2), r.netAfterPayoutsSGD.toFixed(2),
    ].join(",")),
  ].join("\n");

  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `profit-navigator-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const allData = useAllProjectFinancials();
  const { clients } = useDataStore();
  const { data: rainmakerFees } = usePnRainmakerFees();
  const { toSGD, fmtSGD } = useCurrency();

  const [countryFilter, setCountryFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [cmFilter, setCmFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const countries = useMemo(() => {
    const set = new Set(clients.map(c => c.country).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [clients]);

  const accountNames = useMemo(() => {
    const set = new Set(clients.map(c => c.client_name).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [clients]);

  const cmNames = useMemo(() => {
    const set = new Set(allData.map(d => d.project.sales_person || "Unassigned").filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [allData]);

  const reportRows = useMemo<ReportRow[]>(() => {
    return allData
      .filter(d => {
        const client = clients.find(c => c.client_id === d.project.client_id);
        const cm = d.project.sales_person || "Unassigned";
        if (countryFilter !== "All" && client?.country !== countryFilter) return false;
        if (accountFilter !== "All" && client?.client_name !== accountFilter) return false;
        if (cmFilter !== "All" && cm !== cmFilter) return false;
        if (dateFrom || dateTo) {
          const pStart = new Date(d.project.start_date);
          const pEnd = new Date(d.project.end_date);
          if (dateFrom && pEnd < dateFrom) return false;
          if (dateTo && pStart > dateTo) return false;
        }
        return true;
      })
      .map(d => {
        const client = clients.find(c => c.client_id === d.project.client_id);
        const cur = d.project.currency || "SGD";
        const pFees = rainmakerFees.filter(f => f.project_id === d.project.project_id);
        const rainmakerLocal = pFees.reduce((s, f) => {
          const amt = f.fee_type === "percent" ? d.financials.revenueUsed * f.fee_value / 100 : f.fee_value;
          const feeCur = f.currency || cur;
          // Convert fee currency → project currency (simplified: both to SGD then compare)
          return s + toSGD(amt, feeCur) / (toSGD(1, cur) || 1);
        }, 0);
        const rainmakerSGD = pFees.reduce((s, f) => {
          const amt = f.fee_type === "percent" ? d.financials.revenueUsed * f.fee_value / 100 : f.fee_value;
          return s + toSGD(amt, f.currency || cur);
        }, 0);

        return {
          accountName: client?.client_name ?? "Unknown",
          country: client?.country ?? "",
          clientManager: d.project.sales_person || "Unassigned",
          projectName: d.project.project_name,
          projectCode: d.project.project_code,
          status: d.project.status,
          startDate: d.project.start_date,
          endDate: d.project.end_date,
          currency: cur,
          estimatedMarginPct: d.project.margin_target_percent,
          revenue: d.financials.revenueUsed,
          revenueSGD: toSGD(d.financials.revenueUsed, cur),
          vendorCosts: d.financials.vendorCost,
          vendorCostsSGD: toSGD(d.financials.vendorCost, cur),
          rainmakerFee: rainmakerLocal,
          rainmakerFeeSGD: rainmakerSGD,
          grossProfit: d.financials.grossMargin,
          grossProfitSGD: toSGD(d.financials.grossMargin, cur),
          gpPct: d.financials.grossMarginPct,
          netAfterPayouts: d.financials.netMarginAfterPayouts,
          netAfterPayoutsSGD: toSGD(d.financials.netMarginAfterPayouts, cur),
        };
      })
      .sort((a, b) => a.accountName.localeCompare(b.accountName) || a.clientManager.localeCompare(b.clientManager));
  }, [allData, clients, rainmakerFees, countryFilter, accountFilter, cmFilter, dateFrom, dateTo, toSGD]);

  const totals = useMemo(() => ({
    revenueSGD: reportRows.reduce((s, r) => s + r.revenueSGD, 0),
    vendorCostsSGD: reportRows.reduce((s, r) => s + r.vendorCostsSGD, 0),
    rainmakerFeeSGD: reportRows.reduce((s, r) => s + r.rainmakerFeeSGD, 0),
    grossProfitSGD: reportRows.reduce((s, r) => s + r.grossProfitSGD, 0),
    netAfterPayoutsSGD: reportRows.reduce((s, r) => s + r.netAfterPayoutsSGD, 0),
  }), [reportRows]);

  const overallGpPct = totals.revenueSGD > 0 ? totals.grossProfitSGD / totals.revenueSGD : 0;

  const hasFilters = countryFilter !== "All" || accountFilter !== "All" || cmFilter !== "All" || dateFrom || dateTo;

  const clearFilters = useCallback(() => {
    setCountryFilter("All");
    setAccountFilter("All");
    setCmFilter("All");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">{reportRows.length} projects · all amounts in local currency unless stated</p>
        </div>
        <Button size="sm" onClick={() => exportCSV(reportRows)} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Country</label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {countries.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Countries" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Account</label>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {accountNames.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Accounts" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Client Manager</label>
          <Select value={cmFilter} onValueChange={setCmFilter}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {cmNames.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Managers" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Date Range</label>
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Revenue", value: fmtSGD(totals.revenueSGD) },
          { label: "Vendor Costs", value: fmtSGD(totals.vendorCostsSGD) },
          { label: "Rainmaker Fees", value: fmtSGD(totals.rainmakerFeeSGD) },
          { label: "Gross Profit", value: fmtSGD(totals.grossProfitSGD) },
          { label: "GP%", value: fmtPercent(overallGpPct) },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-lg font-bold tabular-nums mono mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Report Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table text-xs">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Account</th>
                <th>Country</th>
                <th>Client Manager</th>
                <th>Project</th>
                <th>Status</th>
                <th>Est. Margin</th>
                <th className="text-right">Revenue (SG$)</th>
                <th className="text-right">Vendor Costs</th>
                <th className="text-right">Rainmaker Fee</th>
                <th className="text-right">Gross Profit</th>
                <th className="text-right">GP%</th>
                <th className="text-right">Net After Payouts</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map(r => (
                <tr key={r.projectCode}>
                  <td className="font-medium">{r.accountName}</td>
                  <td className="text-muted-foreground">{r.country}</td>
                  <td>{r.clientManager}</td>
                  <td>
                    <div>{r.projectName}</div>
                    <div className="text-muted-foreground">{r.projectCode}</div>
                  </td>
                  <td>
                    <span className={`badge-${r.status === "ACTIVE" || r.status === "Active" ? "positive" : "warning"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-center text-muted-foreground">{r.estimatedMarginPct}%</td>
                  <td className="text-right tabular-nums mono">{fmtSGD(r.revenueSGD)}</td>
                  <td className="text-right tabular-nums mono text-muted-foreground">{fmtSGD(r.vendorCostsSGD)}</td>
                  <td className="text-right tabular-nums mono text-muted-foreground">{fmtSGD(r.rainmakerFeeSGD)}</td>
                  <td className="text-right tabular-nums mono font-medium">{fmtSGD(r.grossProfitSGD)}</td>
                  <td className="text-right tabular-nums mono">
                    <span className={r.gpPct >= r.estimatedMarginPct / 100 ? "stat-positive" : "stat-negative"}>
                      {fmtPercent(r.gpPct)}
                    </span>
                  </td>
                  <td className="text-right tabular-nums mono font-bold">{fmtSGD(r.netAfterPayoutsSGD)}</td>
                </tr>
              ))}

              {/* Totals row */}
              {reportRows.length > 0 && (
                <tr className="font-bold border-t-2 bg-muted/20" style={{ borderColor: "var(--glass-border)" }}>
                  <td colSpan={6} className="font-semibold">Totals ({reportRows.length} projects)</td>
                  <td className="text-right tabular-nums mono">{fmtSGD(totals.revenueSGD)}</td>
                  <td className="text-right tabular-nums mono">{fmtSGD(totals.vendorCostsSGD)}</td>
                  <td className="text-right tabular-nums mono">{fmtSGD(totals.rainmakerFeeSGD)}</td>
                  <td className="text-right tabular-nums mono">{fmtSGD(totals.grossProfitSGD)}</td>
                  <td className="text-right tabular-nums mono">
                    <span className={overallGpPct >= 0.3 ? "stat-positive" : "stat-negative"}>
                      {fmtPercent(overallGpPct)}
                    </span>
                  </td>
                  <td className="text-right tabular-nums mono">{fmtSGD(totals.netAfterPayoutsSGD)}</td>
                </tr>
              )}

              {reportRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    No projects match the current filters.
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
