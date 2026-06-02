import { useMemo } from "react";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { fmtMoney as fmtCurrency, fmtPercent } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  data: ProjectWithFinancials[];
}

export function ProfitabilityTab({ data }: Props) {
  const profitabilityData = useMemo(() =>
    data
      .map(d => ({
        name: d.project.project_name.length > 20 ? d.project.project_name.slice(0, 20) + "…" : d.project.project_name,
        fullName: d.project.project_name,
        revenue: d.financials.revenueUsed,
        grossMargin: d.financials.grossMargin,
        netMargin: d.financials.netMarginAfterPayouts,
        gmPct: d.financials.grossMarginPct * 100,
        target: d.project.margin_target_percent,
        model: d.project.commercial_model,
      }))
      .sort((a, b) => b.gmPct - a.gmPct),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold mb-4">Project Profitability Ranking (GM%)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitabilityData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={v => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" width={150} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "GM%"]}
                labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName ?? l}
              />
              <Bar dataKey="gmPct" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {profitabilityData.map((entry, i) => (
                  <Cell key={i} fill={entry.gmPct >= entry.target ? "hsl(var(--positive))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Model</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Gross Margin</th>
                <th className="text-right">GM%</th>
                <th className="text-right">Target</th>
                <th className="text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {profitabilityData.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium">{p.fullName}</td>
                  <td>
                    <Badge variant={p.model === "PARTNER_PASS_THROUGH" ? "secondary" : "default"} className="text-xs">
                      {p.model === "PARTNER_PASS_THROUGH" ? "Pass-Through" : "Enfactum-Led"}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.revenue)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.grossMargin)}</td>
                  <td className="text-right tabular-nums mono">
                    <span className={p.gmPct >= p.target ? "stat-positive font-medium" : "stat-negative font-medium"}>
                      {p.gmPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right tabular-nums mono text-muted-foreground">{p.target}%</td>
                  <td className="text-right tabular-nums mono font-bold">{fmtCurrency(p.netMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
