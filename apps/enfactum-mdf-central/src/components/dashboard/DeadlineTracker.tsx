import { Clock, AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Activity, getDeadlineRisk } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeadlineRiskBadge } from "@/components/shared/StatusBadge";
import { CURRENCIES, MARKETS } from "@/lib/constants";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DeadlineTrackerProps {
  activities: Activity[];
  onViewAll?: () => void;
  onActivityClick?: (activity: Activity) => void;
}

export function DeadlineTracker({ activities, onViewAll, onActivityClick }: DeadlineTrackerProps) {
  // Filter and sort activities by deadline risk
  const trackedActivities = activities
    .filter(a => a.claim_deadline || a.financials?.claim_deadline)
    .map(a => {
      const deadline = a.claim_deadline || a.financials?.claim_deadline;
      const daysRemaining = deadline 
        ? differenceInDays(new Date(deadline), new Date())
        : null;
      const risk = getDeadlineRisk(deadline);
      return { ...a, daysRemaining, risk, deadline };
    })
    .filter(a => a.risk !== 'safe')
    .sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999))
    .slice(0, 6);

  const urgentCount = trackedActivities.filter(a => a.risk === 'urgent').length;
  const atRiskCount = trackedActivities.filter(a => a.risk === 'at-risk').length;
  const overdueCount = trackedActivities.filter(a => a.risk === 'overdue').length;

  const riskIcons = {
    safe: <CheckCircle className="h-4 w-4 text-success" />,
    'at-risk': <AlertTriangle className="h-4 w-4 text-amber-500" />,
    urgent: <AlertCircle className="h-4 w-4 text-red-500" />,
    overdue: <AlertCircle className="h-4 w-4 text-red-600" />,
  };

  if (trackedActivities.length === 0) {
    return (
      <div className="section-container p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Deadline Tracker</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All Clear!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No activities approaching deadlines
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Deadline Tracker</h3>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onViewAll}>
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-2 mb-4">
        {overdueCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {overdueCount} Overdue
          </Badge>
        )}
        {urgentCount > 0 && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 gap-1">
            {urgentCount} Urgent
          </Badge>
        )}
        {atRiskCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 gap-1">
            {atRiskCount} At Risk
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {trackedActivities.map((activity) => {
          const marketLabel = MARKETS.find(m => m.value === activity.market)?.label || activity.market;
          const currencySymbol = CURRENCIES.find(c => c.value === activity.currency)?.symbol || '$';

          return (
            <div
              key={activity.id}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-colors",
                activity.risk === 'overdue' && "border-red-300 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800",
                activity.risk === 'urgent' && "border-red-200 bg-red-50/30 dark:bg-red-900/5 dark:border-red-900",
                activity.risk === 'at-risk' && "border-amber-200 bg-amber-50/30 dark:bg-amber-900/5 dark:border-amber-900",
                "hover:shadow-sm"
              )}
              onClick={() => onActivityClick?.(activity)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {riskIcons[activity.risk]}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {marketLabel} • {currencySymbol}{activity.approved_budget?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <DeadlineRiskBadge 
                  risk={activity.risk} 
                  daysRemaining={activity.daysRemaining || undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
