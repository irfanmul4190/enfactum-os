import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}

const colorMap = {
  blue: "hsl(var(--chart-1))",
  green: "hsl(var(--chart-2))",
  amber: "hsl(var(--chart-3))",
  red: "hsl(var(--negative))",
  purple: "hsl(var(--chart-4))",
};

export function KPICard({ title, value, subtitle, change, changeLabel, icon, highlight, color = "blue" }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const accentColor = colorMap[color];

  return (
    <div className={cn("kpi-card relative overflow-hidden", highlight && "ring-1 ring-inset")} style={highlight ? { "--tw-ring-color": accentColor } as React.CSSProperties : {}}>
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          {title}
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}22` }}>
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="mono text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </div>

      {subtitle && (
        <div className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          {subtitle}
        </div>
      )}

      {change !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "stat-positive" : "stat-negative")}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{change.toFixed(1)}% {changeLabel || "YoY"}
        </div>
      )}
    </div>
  );
}
