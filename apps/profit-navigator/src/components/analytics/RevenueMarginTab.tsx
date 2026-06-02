import { useMemo } from "react";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { fmtMoney as fmtCurrency } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: ProjectWithFinancials[];
}

export function RevenueMarginTab({ data }: Props) {
  const revMarginData = useMemo(() =>
    data.map(d => ({
      name: d.project.project_name.length > 15 ? d.project.project_name.slice(0, 15) + "…" : d.project.project_name,
      revenue: d.financials.revenueUsed,
      grossMargin: d.financials.grossMargin,
      netMargin: d.financials.netMarginAfterPayouts,
      gmPct: +(d.financials.grossMarginPct * 100).toFixed(1),
    })),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold mb-4">Revenue vs Margin by Project</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revMarginData} margin={{ left: 10, right: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-20} textAnchor="end" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => fmtCurrency(v)} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [fmtCurrency(v), name === "revenue" ? "Revenue" : name === "grossMargin" ? "Gross Margin" : "Net Margin"]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="grossMargin" name="Gross Margin" fill="hsl(var(--positive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="netMargin" name="Net Margin" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-base font-semibold mb-4">Gross Margin % by Project</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revMarginData} margin={{ left: 10, right: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-20} textAnchor="end" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${v}%`} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, "GM%"]}
              />
              <Bar dataKey="gmPct" name="GM%" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
