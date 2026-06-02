import { useMemo } from "react";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { fmtMoney as fmtCurrency } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--warning))",
  "hsl(var(--positive))",
];

interface Props {
  data: ProjectWithFinancials[];
}

export function BusinessMixTab({ data }: Props) {
  const businessMixData = useMemo(() => {
    const byType: Record<string, { revenue: number; grossMargin: number; netMargin: number; projects: number }> = {};
    data.forEach(d => {
      const bt = d.project.business_type || "Consulting";
      if (!byType[bt]) byType[bt] = { revenue: 0, grossMargin: 0, netMargin: 0, projects: 0 };
      byType[bt].revenue += d.financials.revenueUsed;
      byType[bt].grossMargin += d.financials.grossMargin;
      byType[bt].netMargin += d.financials.netMarginAfterPayouts;
      byType[bt].projects += 1;
    });
    return Object.entries(byType).map(([type, vals]) => ({
      name: type,
      ...vals,
      gmPct: vals.revenue > 0 ? +(vals.grossMargin / vals.revenue * 100).toFixed(1) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const businessMixPie = useMemo(() =>
    businessMixData.map(d => ({ name: d.name, value: d.revenue })).filter(d => d.value > 0),
    [businessMixData]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold mb-4">Revenue by Business Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={businessMixPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {businessMixPie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmtCurrency(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-base font-semibold mb-4">Revenue & Margin by Business Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessMixData} margin={{ left: 10, right: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => fmtCurrency(v)} />
                <ReTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [fmtCurrency(v), name]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="grossMargin" name="Gross Margin" fill="hsl(var(--positive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="netMargin" name="Net Margin" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Business Type Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Business Type</th>
                <th className="text-right">Projects</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Gross Margin</th>
                <th className="text-right">GM%</th>
                <th className="text-right">Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {businessMixData.map(b => (
                <tr key={b.name}>
                  <td className="font-medium">{b.name}</td>
                  <td className="text-right tabular-nums mono">{b.projects}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(b.revenue)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(b.grossMargin)}</td>
                  <td className="text-right tabular-nums mono">
                    <span className={b.gmPct >= 30 ? "stat-positive font-medium" : "stat-negative font-medium"}>
                      {b.gmPct}%
                    </span>
                  </td>
                  <td className="text-right tabular-nums mono font-bold">{fmtCurrency(b.netMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
