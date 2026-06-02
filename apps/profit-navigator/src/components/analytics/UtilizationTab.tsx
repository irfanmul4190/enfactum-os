import { useMemo } from "react";
import { fmtMoney as fmtCurrency, fmtNumber } from "@/lib/formatters";
import { useDataStore } from "@/hooks/useDataStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  totalInternalCost: number;
}

export function UtilizationTab({ totalInternalCost }: Props) {
  const { timesheets, resources } = useDataStore();

  const utilizationData = useMemo(() => {
    const approvedTs = timesheets.filter(t => t.status === "Approved");
    const byResource: Record<string, { hours: number; cost: number; recharge: number }> = {};
    approvedTs.forEach(t => {
      if (!byResource[t.resource_id]) byResource[t.resource_id] = { hours: 0, cost: 0, recharge: 0 };
      byResource[t.resource_id].hours += t.hours;
      byResource[t.resource_id].cost += t.cost_amount;
      byResource[t.resource_id].recharge += t.recharge_amount;
    });
    return Object.entries(byResource).map(([rid, vals]) => {
      const res = resources.find(r => r.resource_id === rid);
      return {
        name: res?.resource_name ?? rid,
        role: res?.role ?? "Unknown",
        hours: vals.hours,
        cost: vals.cost,
        recharge: vals.recharge,
        margin: vals.recharge - vals.cost,
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [timesheets, resources]);

  const totalHours = useMemo(() => utilizationData.reduce((s, u) => s + u.hours, 0), [utilizationData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="kpi-card">
          <span className="text-xs font-medium text-muted-foreground">Total Hours Logged</span>
          <div className="text-xl font-bold tabular-nums mono mt-1">{fmtNumber(totalHours, 1)}</div>
          <p className="text-xs text-muted-foreground">Approved timesheets</p>
        </div>
        <div className="kpi-card">
          <span className="text-xs font-medium text-muted-foreground">Total Internal Cost</span>
          <div className="text-xl font-bold tabular-nums mono mt-1">{fmtCurrency(totalInternalCost)}</div>
        </div>
        <div className="kpi-card">
          <span className="text-xs font-medium text-muted-foreground">Active Resources</span>
          <div className="text-xl font-bold tabular-nums mono mt-1">{utilizationData.length}</div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-base font-semibold mb-4">Hours by Resource</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [name === "hours" ? `${v} hrs` : fmtCurrency(v), name === "hours" ? "Hours" : name === "cost" ? "Cost" : "Recharge"]}
              />
              <Bar dataKey="hours" name="Hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Resource Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Role</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Recharge</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {utilizationData.map(u => (
                <tr key={u.name}>
                  <td className="font-medium">{u.name}</td>
                  <td className="text-muted-foreground">{u.role}</td>
                  <td className="text-right tabular-nums mono">{fmtNumber(u.hours, 1)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(u.cost)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(u.recharge)}</td>
                  <td className="text-right tabular-nums mono font-medium">
                    <span className={u.margin >= 0 ? "stat-positive" : "stat-negative"}>{fmtCurrency(u.margin)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
