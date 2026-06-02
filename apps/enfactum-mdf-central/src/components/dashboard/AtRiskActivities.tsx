import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Activity } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDaysUntilDeadline, formatCountdown } from "@/lib/date-utils";
import { MARKETS, CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AtRiskActivitiesProps {
  activities: Activity[];
  onViewAll?: () => void;
  onActivityClick?: (activity: Activity) => void;
}

export function AtRiskActivities({ activities, onViewAll, onActivityClick }: AtRiskActivitiesProps) {
  const atRiskActivities = activities
    .filter(a => {
      const days = getDaysUntilDeadline(a.claim_deadline);
      return days !== null && days <= 14 && days >= 0;
    })
    .slice(0, 5);

  if (atRiskActivities.length === 0) {
    return (
      <div className="section-container p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-foreground">Activities at Risk</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All Clear!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No activities approaching claim deadline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-foreground">Activities at Risk</h3>
          <Badge variant="destructive" className="rounded-full">
            {atRiskActivities.length}
          </Badge>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onViewAll}>
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {atRiskActivities.map((activity) => {
          const daysRemaining = getDaysUntilDeadline(activity.claim_deadline);
          const marketLabel = MARKETS.find(m => m.value === activity.market)?.label || activity.market;
          const currencySymbol = CURRENCIES.find(c => c.value === activity.currency)?.symbol || '$';

          return (
            <div
              key={activity.id}
              className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={() => onActivityClick?.(activity)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {activity.activity_id}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {activity.bu}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {marketLabel} • {currencySymbol}{activity.approved_budget.toLocaleString()}
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-semibold shrink-0",
                  daysRemaining !== null && daysRemaining <= 7 ? "text-destructive" : "text-warning"
                )}>
                  <Clock className="h-4 w-4" />
                  <span>{formatCountdown(daysRemaining)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
