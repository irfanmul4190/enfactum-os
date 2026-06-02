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
  totals: { internalCost: number; vendorCost: number; otherCost: number; totalPayouts: number };
}

export function CostBreakdownTab({ data, totals }: Props) {
  const costPie = useMemo(() => [
    { name: "Internal (Timesheets)", value: totals.internalCost },
    { name: "Vendor Costs", value: totals.vendorCost },
    { name: "Other Costs", value: totals.otherCost },
    { name: "Payouts", value: totals.totalPayouts },
  ].filter(c => c.value > 0), [totals]);

  const perProjectCosts = useMemo(() =>
    data.map(d => ({
      name: d.project.project_name.length > 15 ? d.project.project_name.slice(0, 15) + "…" : d.project.project_name,
      internal: d.financials.internalCost,
      vendor: d.financials.vendorCost,
      other: d.financials.otherCost,
    })),
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold mb-4">Overall Cost Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {costPie.map((_, i) => (
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
          <h3 className="text-base font-semibold mb-4">Cost Breakdown by Project</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perProjectCosts} margin={{ left: 10, right: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-20} textAnchor="end" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => fmtCurrency(v)} />
                <ReTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [fmtCurrency(v), name]}
                />
                <Legend />
                <Bar dataKey="internal" name="Internal" fill="hsl(var(--primary))" stackId="costs" maxBarSize={40} />
                <Bar dataKey="vendor" name="Vendor" fill="hsl(var(--chart-2))" stackId="costs" maxBarSize={40} />
                <Bar dataKey="other" name="Other" fill="hsl(var(--chart-3))" stackId="costs" maxBarSize={40} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Cost Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th className="text-right">% of Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {costPie.map(c => {
                const totalCost = costPie.reduce((s, v) => s + v.value, 0);
                return (
                  <tr key={c.name}>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-right tabular-nums mono">{fmtCurrency(c.value)}</td>
                    <td className="text-right tabular-nums mono text-muted-foreground">{totalCost > 0 ? ((c.value / totalCost) * 100).toFixed(1) : 0}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
