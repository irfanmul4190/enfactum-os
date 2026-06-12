import React, { useMemo, useState } from "react";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { useDataStore } from "@/hooks/useDataStore";
import { usePnRainmakerFees } from "@/hooks/useSupabaseData";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtPercent } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RainmakerFeeDialog from "@/components/forms/RainmakerFeeDialog";

function MarginArrow({ actual, target }: { actual: number; target: number }) {
  const diff = actual - target / 100;
  if (Math.abs(diff) < 0.01) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (diff > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
}

function calcRainmaker(
  fees: ReturnType<typeof usePnRainmakerFees>["data"],
  projectId: string,
  revenue: number,
  projectCur: string,
  toSGD: (n: number, cur: string) => number
) {
  return fees
    .filter(f => f.project_id === projectId)
    .reduce((s, f) => {
      const amt = f.fee_type === "percent" ? revenue * f.fee_value / 100 : f.fee_value;
      return s + toSGD(amt, f.currency || projectCur);
    }, 0);
}

export default function ProfitabilityPage() {
  const allData = useAllProjectFinancials();
  const { clients } = useDataStore();
  const { data: rainmakerFees, refetch: refetchFees } = usePnRainmakerFees();
  const { fmtSGD, toSGD } = useCurrency();

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedCMs, setExpandedCMs] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState("All");
  const [rainmakerDialogProject, setRainmakerDialogProject] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set(clients.map(c => c.country).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [clients]);

  const hierarchy = useMemo(() => {
    const filtered = allData.filter(d => {
      if (countryFilter === "All") return true;
      const client = clients.find(c => c.client_id === d.project.client_id);
      return client?.country === countryFilter;
    });

    const accountMap: Record<string, {
      accountId: string;
      accountName: string;
      country: string;
      cms: Record<string, { cmName: string; projects: typeof filtered }>;
    }> = {};

    for (const d of filtered) {
      const client = clients.find(c => c.client_id === d.project.client_id);
      const aid = d.project.client_id;
      const cmName = d.project.sales_person || "Unassigned";

      if (!accountMap[aid]) {
        accountMap[aid] = {
          accountId: aid,
          accountName: client?.client_name ?? "Unknown Account",
          country: client?.country ?? "",
          cms: {},
        };
      }
      if (!accountMap[aid].cms[cmName]) {
        accountMap[aid].cms[cmName] = { cmName, projects: [] };
      }
      accountMap[aid].cms[cmName].projects.push(d);
    }

    return Object.values(accountMap).sort((a, b) => a.accountName.localeCompare(b.accountName));
  }, [allData, clients, countryFilter]);

  function toggleAccount(id: string) {
    setExpandedAccounts(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleCM(key: string) {
    setExpandedCMs(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profitability</h1>
          <p className="text-sm text-muted-foreground mt-1">Account → Client Manager → Project breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Country</label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All Countries" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {countryFilter !== "All" && (
            <Button variant="ghost" size="sm" className="mt-4 h-8 text-xs" onClick={() => setCountryFilter("All")}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-8"></th>
                <th>Account / CM / Project</th>
                <th className="text-right">Est. Margin</th>
                <th className="text-right">Actual Margin</th>
                <th className="text-right">Revenue (SG$)</th>
                <th className="text-right">Vendor Costs</th>
                <th className="text-right">Rainmaker Fee</th>
                <th className="text-right">Gross Profit</th>
                <th className="text-right">GP%</th>
              </tr>
            </thead>
            <tbody>
              {hierarchy.map(account => {
                const isAccExp = expandedAccounts.has(account.accountId);
                const cmList = Object.values(account.cms);
                const allProjects = cmList.flatMap(cm => cm.projects);

                const accRevSGD = allProjects.reduce((s, d) => s + toSGD(d.financials.revenueUsed, d.project.currency || "SGD"), 0);
                const accGpSGD = allProjects.reduce((s, d) => s + toSGD(d.financials.grossMargin, d.project.currency || "SGD"), 0);
                const accVendorSGD = allProjects.reduce((s, d) => s + toSGD(d.financials.vendorCost, d.project.currency || "SGD"), 0);
                const accRainSGD = allProjects.reduce((s, d) => {
                  const cur = d.project.currency || "SGD";
                  return s + calcRainmaker(rainmakerFees, d.project.project_id, d.financials.revenueUsed, cur, toSGD);
                }, 0);
                const accGpPct = accRevSGD > 0 ? accGpSGD / accRevSGD : 0;

                return (
                  <React.Fragment key={account.accountId}>
                    {/* ── Account row ── */}
                    <tr
                      className="cursor-pointer font-semibold bg-muted/20 hover:bg-muted/30"
                      onClick={() => toggleAccount(account.accountId)}
                    >
                      <td className="w-8">
                        {isAccExp
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td>
                        <span className="font-semibold">{account.accountName}</span>
                        {account.country && (
                          <span className="text-xs text-muted-foreground ml-2">{account.country}</span>
                        )}
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          {cmList.length} CM{cmList.length !== 1 ? "s" : ""} · {allProjects.length} project{allProjects.length !== 1 ? "s" : ""}
                        </Badge>
                      </td>
                      <td />
                      <td />
                      <td className="text-right tabular-nums mono font-semibold">{fmtSGD(accRevSGD)}</td>
                      <td className="text-right tabular-nums mono text-muted-foreground">{fmtSGD(accVendorSGD)}</td>
                      <td className="text-right tabular-nums mono text-muted-foreground">{fmtSGD(accRainSGD)}</td>
                      <td className="text-right tabular-nums mono font-semibold">{fmtSGD(accGpSGD)}</td>
                      <td className="text-right tabular-nums mono">
                        <span className={accGpPct >= 0.3 ? "stat-positive font-medium" : "stat-negative font-medium"}>
                          {fmtPercent(accGpPct)}
                        </span>
                      </td>
                    </tr>

                    {isAccExp && cmList.map(cm => {
                      const cmKey = `${account.accountId}::${cm.cmName}`;
                      const isCmExp = expandedCMs.has(cmKey);

                      const cmRevSGD = cm.projects.reduce((s, d) => s + toSGD(d.financials.revenueUsed, d.project.currency || "SGD"), 0);
                      const cmGpSGD = cm.projects.reduce((s, d) => s + toSGD(d.financials.grossMargin, d.project.currency || "SGD"), 0);
                      const cmVendorSGD = cm.projects.reduce((s, d) => s + toSGD(d.financials.vendorCost, d.project.currency || "SGD"), 0);
                      const cmRainSGD = cm.projects.reduce((s, d) => {
                        const cur = d.project.currency || "SGD";
                        return s + calcRainmaker(rainmakerFees, d.project.project_id, d.financials.revenueUsed, cur, toSGD);
                      }, 0);
                      const cmGpPct = cmRevSGD > 0 ? cmGpSGD / cmRevSGD : 0;

                      return (
                        <React.Fragment key={cmKey}>
                          {/* ── CM row ── */}
                          <tr
                            className="cursor-pointer hover:bg-muted/20"
                            onClick={() => toggleCM(cmKey)}
                          >
                            <td />
                            <td className="pl-6">
                              <div className="flex items-center gap-2">
                                {isCmExp
                                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className="font-medium text-sm">{cm.cmName}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {cm.projects.length} project{cm.projects.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </td>
                            <td /><td />
                            <td className="text-right tabular-nums mono text-sm">{fmtSGD(cmRevSGD)}</td>
                            <td className="text-right tabular-nums mono text-sm text-muted-foreground">{fmtSGD(cmVendorSGD)}</td>
                            <td className="text-right tabular-nums mono text-sm text-muted-foreground">{fmtSGD(cmRainSGD)}</td>
                            <td className="text-right tabular-nums mono text-sm font-medium">{fmtSGD(cmGpSGD)}</td>
                            <td className="text-right tabular-nums mono text-sm">
                              <span className={cmGpPct >= 0.3 ? "stat-positive" : "stat-negative"}>
                                {fmtPercent(cmGpPct)}
                              </span>
                            </td>
                          </tr>

                          {/* ── Project rows ── */}
                          {isCmExp && cm.projects.map(({ project, financials }) => {
                            const cur = project.currency || "SGD";
                            const pFees = rainmakerFees.filter(f => f.project_id === project.project_id);
                            const rainTotal = calcRainmaker(rainmakerFees, project.project_id, financials.revenueUsed, cur, toSGD);
                            const gpOk = financials.grossMarginPct >= project.margin_target_percent / 100;

                            return (
                              <tr key={project.project_id} className="bg-muted/10">
                                <td />
                                <td className="pl-14">
                                  <Link
                                    to={`/projects/${project.project_id}?from=profitability`}
                                    className="text-primary hover:underline text-sm"
                                  >
                                    {project.project_name}
                                  </Link>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">{project.project_code}</span>
                                    <span className={`badge-${project.status === "ACTIVE" || project.status === "Active" ? "positive" : "warning"} text-[10px]`}>
                                      {project.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-right text-sm text-muted-foreground">
                                  {project.margin_target_percent}%
                                </td>
                                <td className="text-right text-sm">
                                  <div className="flex items-center justify-end gap-1">
                                    <MarginArrow actual={financials.grossMarginPct} target={project.margin_target_percent} />
                                    <span className={gpOk ? "stat-positive" : "stat-negative"}>
                                      {fmtPercent(financials.grossMarginPct)}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-right tabular-nums mono text-sm">
                                  {fmtSGD(toSGD(financials.revenueUsed, cur))}
                                </td>
                                <td className="text-right tabular-nums mono text-sm text-muted-foreground">
                                  {fmtSGD(toSGD(financials.vendorCost, cur))}
                                </td>
                                <td className="text-right tabular-nums mono text-sm">
                                  {pFees.length === 0 ? (
                                    <button
                                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 ml-auto"
                                      onClick={() => setRainmakerDialogProject(project.project_id)}
                                    >
                                      <Plus className="h-2.5 w-2.5" /> Add
                                    </button>
                                  ) : (
                                    <button
                                      className="text-muted-foreground hover:text-primary tabular-nums"
                                      onClick={() => setRainmakerDialogProject(project.project_id)}
                                      title="Edit rainmaker fees"
                                    >
                                      {fmtSGD(rainTotal)}
                                    </button>
                                  )}
                                </td>
                                <td className="text-right tabular-nums mono text-sm font-medium">
                                  {fmtSGD(toSGD(financials.grossMargin, cur))}
                                </td>
                                <td className="text-right tabular-nums mono text-sm">
                                  <span className={gpOk ? "stat-positive" : "stat-negative"}>
                                    {fmtPercent(financials.grossMarginPct)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {hierarchy.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                    No projects found{countryFilter !== "All" ? ` for ${countryFilter}` : ""}. Add accounts and projects to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rainmakerDialogProject && (
        <RainmakerFeeDialog
          projectId={rainmakerDialogProject}
          fees={rainmakerFees.filter(f => f.project_id === rainmakerDialogProject)}
          onClose={() => setRainmakerDialogProject(null)}
          onSaved={refetchFees}
        />
      )}
    </div>
  );
}
