import { DollarSign, TrendingUp, TrendingDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";

interface BudgetMetricsCardProps {
  totalAllocated: number;
  totalClaimed: number;
  currency?: string;
}

export function BudgetMetricsCard({ totalAllocated, totalClaimed, currency = 'USD' }: BudgetMetricsCardProps) {
  const permissions = useCurrentUserPermissions();
  const utilizationRate = totalAllocated > 0 ? (totalClaimed / totalAllocated) * 100 : 0;
  const remaining = totalAllocated - totalClaimed;
  const margin = totalAllocated - totalClaimed;
  const marginPercent = totalAllocated > 0 ? (margin / totalAllocated) * 100 : 0;

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="section-container p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Budget Overview</h3>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Allocated</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(totalAllocated)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Claimed</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(totalClaimed)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Utilization Rate</span>
          <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              utilizationRate > 100 ? "bg-destructive" : 
              utilizationRate > 80 ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Remaining */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <span className="text-sm text-muted-foreground">Remaining Budget</span>
        <div className="flex items-center gap-1">
          {remaining >= 0 ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className={cn(
            "font-semibold",
            remaining >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatAmount(Math.abs(remaining))}
          </span>
        </div>
      </div>

      {/* Internal Margin - Only visible to users with can_view_margin permission */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-3">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          {!permissions.can_view_margin && <EyeOff className="h-3 w-3" />}
          Internal Margin
        </span>
        {permissions.can_view_margin ? (
          <span className="font-semibold text-success">
            {formatAmount(margin)}
            <span className="text-xs text-muted-foreground ml-1">
              ({marginPercent.toFixed(1)}%)
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Hidden</span>
        )}
      </div>
    </div>
  );
}
