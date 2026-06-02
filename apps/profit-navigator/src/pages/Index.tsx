import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { useDataStore } from "@/hooks/useDataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtPercent } from "@/lib/formatters";
import { aggregatePortfolioTotals, calculateGrossMarginPct } from "@/lib/financials";
import { detectAllAnomalies } from "@/lib/anomalyDetector";
import { calculateAllClientHealth, getTierColor } from "@/lib/clientHealth";
import { AnomalyFeed } from "@/components/AnomalyFeed";
import { Link } from "react-router-dom";
import { TrendingUp, DollarSign, BarChart3, PieChart, ChevronDown, ChevronRight, Globe, X } from "lucide-react";
import { ErrorBoundary } from "@repo/ui/error-boundary";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

const DASHBOARD_COUNTRIES = ["Singapore", "Malaysia", "Indonesia", "India", "Others"];

export default function Dashboard() {
  const data = useAllProjectFinancials();
  const { clients, projects, invoices, vendorCosts, timesheets } = useDataStore();
  const { toSGD, fmtSGD } = useCurrency();

  // Filters
  const [countryFilter, setCountryFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [salesPersonFilter, setSalesPersonFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Derive unique client names for filter
  const clientNames = useMemo(() => {
    const names = Array.from(new Set(clients.map(c => c.client_name))).sort();
    return ["All", ...names];
  }, [clients]);

  // Derive unique sales persons from projects
  const salesPersons = useMemo(() => {
    const names = Array.from(new Set(projects.filter(p => p.sales_person).map(p => p.sales_person!))).sort();
    return ["All", ...names];
  }, [projects]);

  // Normalize country to dashboard buckets
  const normalizeCountry = (country: string) => {
    if (DASHBOARD_COUNTRIES.slice(0, -1).includes(country)) return country;
    return "Others";
  };

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const client = clients.find(c => c.client_id === d.project.client_id);
      if (countryFilter !== "All") {
        const normalized = normalizeCountry(client?.country ?? "");
        if (normalized !== countryFilter) return false;
      }
      if (clientFilter !== "All" && client?.client_name !== clientFilter) return false;
      if (salesPersonFilter !== "All" && d.project.sales_person !== salesPersonFilter) return false;
      if (modelFilter !== "All" && d.project.commercial_model !== modelFilter) return false;
      if (dateFrom || dateTo) {
        const pStart = new Date(d.project.start_date);
        const pEnd = new Date(d.project.end_date);
        if (dateFrom && pEnd < dateFrom) return false;
        if (dateTo && pStart > dateTo) return false;
      }
      return true;
    });
  }, [data, clients, countryFilter, clientFilter, salesPersonFilter, modelFilter, dateFrom, dateTo]);

  // Client aggregation
  const clientAggregation = useMemo(() => {
    const map: Record<string, {
      clientId: string;
      clientName: string;
      country: string;
      revenueSGD: number;
      grossMarginSGD: number;
      netMarginSGD: number;
      projectCount: number;
      projects: typeof filteredData;
    }> = {};

    filteredData.forEach(d => {
      const cid = d.project.client_id;
      const client = clients.find(c => c.client_id === cid);
      if (!map[cid]) {
        map[cid] = {
          clientId: cid,
          clientName: client?.client_name ?? "Unknown",
          country: client?.country ?? "",
          revenueSGD: 0,
          grossMarginSGD: 0,
          netMarginSGD: 0,
          projectCount: 0,
          projects: [],
        };
      }
      const cur = d.project.currency || "SGD";
      map[cid].revenueSGD += toSGD(d.financials.revenueUsed, cur);
      map[cid].grossMarginSGD += toSGD(d.financials.grossMargin, cur);
      map[cid].netMarginSGD += toSGD(d.financials.netMarginAfterPayouts, cur);
      map[cid].projectCount += 1;
      map[cid].projects.push(d);
    });

    return Object.values(map).sort((a, b) => b.revenueSGD - a.revenueSGD);
  }, [filteredData, clients, toSGD]);

  // Totals (SGD normalized) — uses shared aggregation helper
  const totals = useMemo(() => aggregatePortfolioTotals(filteredData, toSGD), [filteredData, toSGD]);

  const gmPct = calculateGrossMarginPct(totals.revenue, totals.grossMargin);
  const netPct = calculateGrossMarginPct(totals.revenue, totals.netMargin);

  const kpis = [
    { label: "Total Revenue (SG$)", value: fmtSGD(totals.revenue), icon: DollarSign, sub: `${filteredData.length} projects`, accent: "hsl(var(--primary))" },
    { label: "Gross Margin (SG$)", value: fmtSGD(totals.grossMargin), icon: BarChart3, sub: fmtPercent(gmPct), accent: "hsl(var(--positive))" },
    { label: "Gross Margin %", value: fmtPercent(gmPct), icon: PieChart, sub: "Portfolio average", accent: "hsl(var(--warning))" },
    { label: "Net After Payouts (SG$)", value: fmtSGD(totals.netMargin), icon: TrendingUp, sub: fmtPercent(netPct), accent: "hsl(var(--chart-4))" },
  ];

  const hasFilters = countryFilter !== "All" || clientFilter !== "All" || salesPersonFilter !== "All" || modelFilter !== "All" || dateFrom || dateTo;

  // Anomaly detection — runs across all projects (unfiltered) for full portfolio visibility
  const anomalies = useMemo(
    () => detectAllAnomalies(data, invoices, vendorCosts, timesheets),
    [data, invoices, vendorCosts, timesheets]
  );

  // Toast + browser push + audio notifications for high-severity anomalies
  const toastedRef = useRef(false);
  useEffect(() => {
    if (toastedRef.current) return;
    const highAnomalies = anomalies.filter(a => a.severity === "high");
    if (highAnomalies.length > 0) {
      toastedRef.current = true;

      // Toast notification
      import("@/hooks/use-toast").then(({ toast }) => {
        if (highAnomalies.length === 1) {
          toast({
            variant: "destructive",
            title: "⚠️ High Severity Alert",
            description: `${highAnomalies[0].projectName}: ${highAnomalies[0].message}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: `⚠️ ${highAnomalies.length} High Severity Alerts`,
            description: `Critical issues detected across ${highAnomalies.length} projects. Review the Anomaly Feed for details.`,
          });
        }
      });

      // Browser push notification + audio chime
      import("@/lib/notifications").then(({ notifyCriticalAnomaly, requestNotificationPermission }) => {
        requestNotificationPermission().then(() => {
          const body = highAnomalies.length === 1
            ? `${highAnomalies[0].projectName}: ${highAnomalies[0].message}`
            : `Critical issues detected across ${highAnomalies.length} projects`;
          notifyCriticalAnomaly(
            `⚠️ ${highAnomalies.length} Critical Alert${highAnomalies.length > 1 ? "s" : ""}`,
            body,
            () => window.scrollTo({ top: 0, behavior: "smooth" })
          );
        });
      });
    }
  }, [anomalies]);

  // Client health scores
  const clientHealth = useMemo(
    () => calculateAllClientHealth(clients, data, invoices),
    [clients, data, invoices]
  );
  const healthCounts = useMemo(() => {
    const counts = { Healthy: 0, Stable: 0, "At Risk": 0 };
    clientHealth.forEach(h => { counts[h.tier]++; });
    return counts;
  }, [clientHealth]);

  const clearFilters = useCallback(() => {
    setCountryFilter("All");
    setClientFilter("All");
    setSalesPersonFilter("All");
    setModelFilter("All");
    setDateFrom(undefined);
    setDateTo(undefined);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Client-centric profitability overview · All amounts in SG$</p>
      </div>

      {/* Pan-Regional View Label */}
      <div className="glass-card px-5 py-3 flex items-center gap-3">
        <Globe className="h-5 w-5 text-primary" />
        <div>
          <span className="text-sm font-semibold text-foreground">
            {countryFilter === "All" ? "Pan-Regional View" : `${countryFilter} View`}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {countryFilter === "All"
              ? "Showing all markets: Singapore, Malaysia, Indonesia, India & Others"
              : `Filtered to ${countryFilter} market`}
          </span>
        </div>
        {countryFilter !== "All" && (
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setCountryFilter("All")}>
            <Globe className="h-3 w-3 mr-1" /> Show All Regions
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Country</label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Countries</SelectItem>
              {DASHBOARD_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Client</label>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {clientNames.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Clients" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sales Person</label>
          <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {salesPersons.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Sales Persons" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Model</label>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Models</SelectItem>
              <SelectItem value="ENFACTUM_LED">Enfactum-Led</SelectItem>
              <SelectItem value="PARTNER_PASS_THROUGH">Pass-Through</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Date Range</label>
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs justify-start font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
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
                <Button variant="outline" size="sm" className={cn("h-8 text-xs justify-start font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-transparent uppercase tracking-wider">Clear</label>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" /> Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Anomaly Feed */}
      <ErrorBoundary fallbackTitle="Failed to load anomaly alerts">
        <AnomalyFeed anomalies={anomalies} />
      </ErrorBoundary>

      {/* KPI Strip */}
      <ErrorBoundary fallbackTitle="Failed to load KPI summary">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="kpi-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: kpi.accent }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: kpi.accent + "18", color: kpi.accent }}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums mono">{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>
      </ErrorBoundary>

      {/* Client Health Summary */}
      <div className="glass-card px-5 py-3 flex items-center gap-6">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Health</span>
        {(["Healthy", "Stable", "At Risk"] as const).map(tier => (
          <div key={tier} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: getTierColor(tier) }} />
            <span className="text-sm font-bold tabular-nums" style={{ color: getTierColor(tier) }}>{healthCounts[tier]}</span>
            <span className="text-xs text-muted-foreground">{tier}</span>
          </div>
        ))}
      </div>

      {/* Client Aggregation Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h2 className="text-base font-semibold">Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th></th>
                <th>Client</th>
                <th>Country</th>
                <th className="text-right">Revenue (SG$)</th>
                <th className="text-right">Gross Margin (SG$)</th>
                <th className="text-right">GM%</th>
                <th className="text-right"># Projects</th>
                <th className="text-right">Net After Payouts (SG$)</th>
              </tr>
            </thead>
              {clientAggregation.map(ca => {
                const isExpanded = expandedClient === ca.clientId;
                const gmPct = ca.revenueSGD > 0 ? ca.grossMarginSGD / ca.revenueSGD : 0;
                const sortedProjects = [...ca.projects].sort((a, b) => {
                  const dateA = new Date(a.project.start_date).getTime();
                  const dateB = new Date(b.project.start_date).getTime();
                  return dateB - dateA;
                });
                return (
                  <tbody key={ca.clientId}>
                    <tr
                      className="cursor-pointer"
                      onClick={() => setExpandedClient(isExpanded ? null : ca.clientId)}
                    >
                      <td className="w-8">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td className="font-semibold">{ca.clientName}</td>
                      <td className="text-muted-foreground">{ca.country}</td>
                      <td className="text-right tabular-nums mono font-medium">{fmtSGD(ca.revenueSGD)}</td>
                      <td className="text-right tabular-nums mono font-medium">{fmtSGD(ca.grossMarginSGD)}</td>
                      <td className="text-right tabular-nums mono">
                        <span className={gmPct >= 0.3 ? "stat-positive font-medium" : "stat-negative font-medium"}>
                          {fmtPercent(gmPct)}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{ca.projectCount}</td>
                      <td className="text-right tabular-nums mono font-bold">{fmtSGD(ca.netMarginSGD)}</td>
                    </tr>
                    {isExpanded && sortedProjects.map(({ project, financials }) => {
                      const cur = project.currency || "SGD";
                      return (
                        <tr key={project.project_id} className="bg-muted/30">
                          <td></td>
                          <td colSpan={1} className="pl-8">
                            <Link to={`/projects/${project.project_id}?from=dashboard`} className="text-primary hover:underline text-sm">
                              {project.project_name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{project.project_code}</span>
                              {project.sales_person && (
                                <Badge variant="outline" className="text-[10px] py-0">{project.sales_person}</Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge variant={project.commercial_model === "PARTNER_PASS_THROUGH" ? "secondary" : "default"} className="text-xs">
                              {project.commercial_model === "PARTNER_PASS_THROUGH" ? "Pass-Through" : "Enfactum-Led"}
                            </Badge>
                          </td>
                          <td className="text-right tabular-nums mono text-sm">{fmtSGD(toSGD(financials.revenueUsed, cur))}</td>
                          <td className="text-right tabular-nums mono text-sm">{fmtSGD(toSGD(financials.grossMargin, cur))}</td>
                          <td className="text-right tabular-nums mono text-sm">
                            <span className={financials.grossMarginPct >= (project.margin_target_percent / 100) ? "stat-positive" : "stat-negative"}>
                              {fmtPercent(financials.grossMarginPct)}
                            </span>
                          </td>
                          <td></td>
                          <td className="text-right tabular-nums mono text-sm font-medium">{fmtSGD(toSGD(financials.netMarginAfterPayouts, cur))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
          </table>
        </div>
      </div>
    </div>
  );
}
