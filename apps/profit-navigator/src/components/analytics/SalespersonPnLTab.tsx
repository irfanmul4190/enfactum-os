import { useMemo, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, LabelList,
} from "recharts";
import { differenceInDays, parseISO } from "date-fns";
import { fmtMoney, fmtPercent, fmtNumber } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Trophy, TrendingUp, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";

interface Props {
  data: ProjectWithFinancials[];
}

interface SalespersonRow {
  name: string;
  totalRevenue: number;
  totalGrossMargin: number;
  avgGrossMarginPct: number;
  totalNetMargin: number;
  projectCount: number;
  avgDurationDays: number;
  revenuePerProject: number;
}

type SortKey = keyof Omit<SalespersonRow, "name">;

export function SalespersonPnLTab({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalRevenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedSP, setSelectedSP] = useState<string>("all");

  // All salesperson names for the filter
  const salespersonNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach(({ project }) => names.add(project.sales_person || "Unassigned"));
    return Array.from(names).sort();
  }, [data]);

  // Filtered source data
  const filteredData = useMemo(() => {
    if (selectedSP === "all") return data;
    return data.filter(({ project }) => (project.sales_person || "Unassigned") === selectedSP);
  }, [data, selectedSP]);

  const rows = useMemo<SalespersonRow[]>(() => {
    const map: Record<string, {
      revenue: number; gm: number; net: number;
      count: number; totalDays: number;
    }> = {};

    filteredData.forEach(({ project, financials }) => {
      const sp = project.sales_person || "Unassigned";
      if (!map[sp]) map[sp] = { revenue: 0, gm: 0, net: 0, count: 0, totalDays: 0 };
      map[sp].revenue += financials.revenueUsed;
      map[sp].gm += financials.grossMargin;
      map[sp].net += financials.netMarginAfterPayouts;
      map[sp].count += 1;
      const days = differenceInDays(parseISO(project.end_date), parseISO(project.start_date));
      map[sp].totalDays += Math.max(days, 0);
    });

    return Object.entries(map).map(([name, v]) => ({
      name,
      totalRevenue: v.revenue,
      totalGrossMargin: v.gm,
      avgGrossMarginPct: v.revenue > 0 ? v.gm / v.revenue : 0,
      totalNetMargin: v.net,
      projectCount: v.count,
      avgDurationDays: v.count > 0 ? Math.round(v.totalDays / v.count) : 0,
      revenuePerProject: v.count > 0 ? v.revenue / v.count : 0,
    }));
  }, [filteredData]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diff = (a[sortKey] as number) - (b[sortKey] as number);
      return sortAsc ? diff : -diff;
    });
  }, [rows, sortKey, sortAsc]);

  const barData = useMemo(
    () => [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue),
    [rows]
  );

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return key; }
      setSortAsc(false);
      return key;
    });
  }, []);

  // Insight callouts
  const highestMargin = useMemo(() =>
    rows.filter(r => r.name !== "Unassigned").reduce<SalespersonRow | null>(
      (best, r) => (!best || r.avgGrossMarginPct > best.avgGrossMarginPct) ? r : best, null
    ), [rows]);

  const highestVolume = useMemo(() =>
    rows.filter(r => r.name !== "Unassigned").reduce<SalespersonRow | null>(
      (best, r) => (!best || r.totalRevenue > best.totalRevenue) ? r : best, null
    ), [rows]);

  const atRisk = useMemo(() =>
    rows.filter(r => r.name !== "Unassigned" && r.avgGrossMarginPct < 0.25),
    [rows]);

  const COLORS = [
    "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
    "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--positive))",
    "hsl(var(--warning))",
  ];

  return (
    <div className="space-y-6">
      {/* Salesperson Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={selectedSP} onValueChange={setSelectedSP}>
          <SelectTrigger className="w-[220px] h-8 text-sm">
            <SelectValue placeholder="All Salespersons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salespersons</SelectItem>
            {salespersonNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSP !== "all" && (
          <span className="text-xs text-muted-foreground">
            Showing data for <span className="font-semibold text-foreground">{selectedSP}</span>
          </span>
        )}
      </div>

      {/* Insight Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {highestMargin && (
          <div className="glass-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--positive)/0.12)]">
              <Trophy className="h-4 w-4 text-[hsl(var(--positive))]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Highest Margin Seller</p>
              <p className="text-sm font-semibold mt-0.5">
                {highestMargin.name} averages {fmtPercent(highestMargin.avgGrossMarginPct)} gross margin
              </p>
            </div>
          </div>
        )}
        {highestVolume && (
          <div className="glass-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--primary)/0.12)]">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Highest Volume Seller</p>
              <p className="text-sm font-semibold mt-0.5">
                {highestVolume.name} has brought in {fmtMoney(highestVolume.totalRevenue)} in revenue
              </p>
            </div>
          </div>
        )}
        {atRisk.length > 0 && (
          <div className="glass-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--negative)/0.12)]">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--negative))]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">At-Risk Sellers</p>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {atRisk.map(r => (
                  <Badge key={r.name} variant="destructive" className="text-xs">
                    {r.name} ({fmtPercent(r.avgGrossMarginPct)})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        {atRisk.length === 0 && !highestMargin && (
          <div className="glass-card p-4 text-sm text-muted-foreground">No sales data available.</div>
        )}
      </div>

      {/* Revenue Ranking Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4">Revenue by Salesperson</h3>
        {barData.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">No salesperson data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 48)}>
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => fmtNumber(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={120}
              />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [fmtMoney(v), "Revenue"]}
              />
              <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Scatter Plot: Revenue vs Margin */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-1">Volume vs. Margin</h3>
        <p className="text-xs text-muted-foreground mb-4">Bubble size = number of projects</p>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">No data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                type="number"
                dataKey="totalRevenue"
                name="Revenue"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => fmtNumber(v)}
                label={{ value: "Total Revenue", position: "insideBottom", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="number"
                dataKey="avgGrossMarginPctDisplay"
                name="Avg GM%"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => `${v}%`}
                label={{ value: "Avg GM%", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <ZAxis type="number" dataKey="projectCount" range={[200, 1200]} name="Projects" />
              <RTooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-card p-3 text-xs shadow-md space-y-1">
                      <p className="font-bold">{d.name}</p>
                      <p>Revenue: <span className="mono font-medium">{fmtMoney(d.totalRevenue)}</span></p>
                      <p>Avg GM%: <span className="mono font-medium">{d.avgGrossMarginPctDisplay}%</span></p>
                      <p>Projects: <span className="font-medium">{d.projectCount}</span></p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={rows.map(r => ({ ...r, avgGrossMarginPctDisplay: +(r.avgGrossMarginPct * 100).toFixed(1) }))}
              >
                {rows.map((r, i) => (
                  <Cell
                    key={r.name}
                    fill={r.avgGrossMarginPct < 0.25 ? "hsl(var(--negative))" : COLORS[i % COLORS.length]}
                    fillOpacity={0.7}
                  />
                ))}
                <LabelList dataKey="name" position="top" fontSize={10} fill="hsl(var(--muted-foreground))" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-sm font-semibold">Salesperson Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Salesperson</th>
                {([
                  ["totalRevenue", "Revenue"],
                  ["totalGrossMargin", "Gross Margin"],
                  ["avgGrossMarginPct", "Avg GM%"],
                  ["totalNetMargin", "Net Margin"],
                  ["projectCount", "Projects"],
                  ["avgDurationDays", "Avg Duration"],
                  ["revenuePerProject", "Rev/Project"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortKey === key && <ArrowUpDown className="h-3 w-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.name}>
                  <td className="font-medium">
                    <span className="flex items-center gap-2">
                      {r.name}
                      {r.avgGrossMarginPct < 0.25 && r.name !== "Unassigned" && (
                        <Badge variant="destructive" className="text-[10px] py-0">At Risk</Badge>
                      )}
                    </span>
                  </td>
                  <td className="text-right tabular-nums mono font-medium">{fmtMoney(r.totalRevenue)}</td>
                  <td className="text-right tabular-nums mono">{fmtMoney(r.totalGrossMargin)}</td>
                  <td className={cn(
                    "text-right tabular-nums mono font-medium",
                    r.avgGrossMarginPct < 0.25 && r.name !== "Unassigned" ? "text-[hsl(var(--negative))]" : ""
                  )}>
                    {fmtPercent(r.avgGrossMarginPct)}
                  </td>
                  <td className="text-right tabular-nums mono">{fmtMoney(r.totalNetMargin)}</td>
                  <td className="text-right tabular-nums">{r.projectCount}</td>
                  <td className="text-right tabular-nums text-muted-foreground">{r.avgDurationDays}d</td>
                  <td className="text-right tabular-nums mono">{fmtMoney(r.revenuePerProject)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
