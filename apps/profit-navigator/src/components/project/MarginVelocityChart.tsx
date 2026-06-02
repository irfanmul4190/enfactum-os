import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { fmtPercent } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Timesheet, Project } from "@/data/types";

export type Trajectory = "On Track" | "Declining" | "Recovering" | "Critical";

export interface MarginSnapshot {
  month: string;          // "Jan 2025"
  monthKey: string;       // "2025-01"
  cumulativeRevenue: number;
  cumulativeCost: number;
  marginPct: number;
  momChange: number | null;
}

// ─── Pure computation ───────────────────────────────────────────

export function computeMarginSnapshots(
  project: Project,
  timesheets: Timesheet[],
): MarginSnapshot[] {
  if (timesheets.length === 0) return [];

  // Group by month, accumulate chronologically
  const sorted = [...timesheets].sort((a, b) => a.work_date.localeCompare(b.work_date));
  const monthMap: Record<string, { cost: number; recharge: number }> = {};

  sorted.forEach(t => {
    const mKey = format(startOfMonth(parseISO(t.work_date)), "yyyy-MM");
    if (!monthMap[mKey]) monthMap[mKey] = { cost: 0, recharge: 0 };
    monthMap[mKey].cost += t.cost_amount;
    monthMap[mKey].recharge += t.recharge_amount;
  });

  const months = Object.keys(monthMap).sort();
  let cumRevenue = 0;
  let cumCost = 0;
  let prevPct: number | null = null;

  // Use contracted revenue spread evenly, or recharge-based revenue
  const contractedRevenue = project.contracted_revenue_ex_tax;
  const totalMonths = months.length;
  const monthlyRevenuePortion = totalMonths > 0 ? contractedRevenue / totalMonths : 0;

  return months.map(mKey => {
    cumRevenue += monthlyRevenuePortion;
    cumCost += monthMap[mKey].cost;

    const marginPct = cumRevenue > 0 ? (cumRevenue - cumCost) / cumRevenue : 0;
    const momChange = prevPct !== null ? marginPct - prevPct : null;
    prevPct = marginPct;

    return {
      month: format(parseISO(mKey + "-01"), "MMM yyyy"),
      monthKey: mKey,
      cumulativeRevenue: cumRevenue,
      cumulativeCost: cumCost,
      marginPct,
      momChange,
    };
  });
}

export function getTrajectory(snapshots: MarginSnapshot[], targetPct: number): Trajectory {
  if (snapshots.length < 2) return "On Track";

  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];
  const target = targetPct / 100;

  if (latest.marginPct < target - 0.10) return "Critical";
  if (latest.marginPct >= target) {
    return "On Track";
  }
  // Below target
  if (latest.marginPct > prev.marginPct) return "Recovering";
  return "Declining";
}

export function getTrajectoryColor(trajectory: Trajectory): string {
  switch (trajectory) {
    case "On Track": return "hsl(var(--positive))";
    case "Recovering": return "hsl(var(--warning))";
    case "Declining": return "hsl(var(--warning))";
    case "Critical": return "hsl(var(--negative))";
  }
}

// ─── Chart Component ────────────────────────────────────────────

interface MarginVelocityChartProps {
  project: Project;
  timesheets: Timesheet[];
}

export function MarginVelocityChart({ project, timesheets }: MarginVelocityChartProps) {
  const snapshots = useMemo(
    () => computeMarginSnapshots(project, timesheets),
    [project, timesheets]
  );

  const trajectory = useMemo(
    () => getTrajectory(snapshots, project.margin_target_percent),
    [snapshots, project.margin_target_percent]
  );

  if (snapshots.length < 2) return null;

  const targetPct = project.margin_target_percent / 100;
  const trajectoryColor = getTrajectoryColor(trajectory);

  const TrajectoryIcon = trajectory === "On Track" ? TrendingUp
    : trajectory === "Recovering" ? TrendingUp
    : trajectory === "Declining" ? TrendingDown
    : AlertTriangle;

  // Determine line color per data point
  const chartData = snapshots.map(s => {
    const diff = s.marginPct - targetPct;
    let color: string;
    if (diff >= 0) color = "hsl(var(--positive))";
    else if (diff >= -0.05) color = "hsl(var(--warning))";
    else color = "hsl(var(--negative))";

    return {
      ...s,
      marginDisplay: +(s.marginPct * 100).toFixed(1),
      targetDisplay: +(targetPct * 100).toFixed(1),
      color,
    };
  });

  // Use the latest point's color for the line
  const latestColor = chartData[chartData.length - 1].color;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Margin Velocity</h3>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: trajectoryColor + "18", color: trajectoryColor }}
        >
          <TrajectoryIcon className="h-3.5 w-3.5" />
          {trajectory}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={v => `${v}%`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(_v: number, name: string) => undefined}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              const diff = d.marginDisplay - d.targetDisplay;
              const mom = snapshots.find(s => s.month === d.month)?.momChange;
              return (
                <div className="rounded-lg border bg-card p-3 text-xs shadow-md space-y-1">
                  <p className="font-semibold">{d.month}</p>
                  <p>Margin: <span className="font-bold mono">{d.marginDisplay}%</span></p>
                  <p>vs Target: <span className={cn("font-bold mono", diff >= 0 ? "text-[hsl(var(--positive))]" : "text-[hsl(var(--negative))]")}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)}pp
                  </span></p>
                  {mom !== null && mom !== undefined && (
                    <p className="flex items-center gap-1">
                      MoM: {mom >= 0
                        ? <TrendingUp className="h-3 w-3 text-[hsl(var(--positive))]" />
                        : <TrendingDown className="h-3 w-3 text-[hsl(var(--negative))]" />}
                      <span className={cn("font-bold mono", mom >= 0 ? "text-[hsl(var(--positive))]" : "text-[hsl(var(--negative))]")}>
                        {mom >= 0 ? "+" : ""}{(mom * 100).toFixed(1)}pp
                      </span>
                    </p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine
            y={targetPct * 100}
            stroke="hsl(var(--primary))"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `Target ${project.margin_target_percent}%`,
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--primary))",
            }}
          />
          <Line
            type="monotone"
            dataKey="marginDisplay"
            stroke={latestColor}
            strokeWidth={2.5}
            dot={{ r: 4, fill: latestColor, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
