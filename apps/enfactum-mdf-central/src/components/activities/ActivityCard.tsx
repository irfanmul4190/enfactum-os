import { Clock, AlertTriangle, CheckCircle2, Building2, DollarSign, Mail } from "lucide-react";
import { Activity, getDeadlineRisk } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { CURRENCIES, MARKETS } from "@/lib/constants";
import { QuarterBadge, DeadlineRiskBadge } from "@/components/shared/StatusBadge";
import { 
  getDaysUntilDeadline, 
  formatCountdown,
  formatShortDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface ActivityCardProps {
  activity: Activity;
  onClick?: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const deadline = activity.claim_deadline || activity.financials?.claim_deadline;
  const daysRemaining = deadline ? differenceInDays(new Date(deadline), new Date()) : null;
  const deadlineRisk = getDeadlineRisk(deadline);
  const isAtRisk = deadlineRisk === 'at-risk' || deadlineRisk === 'urgent' || deadlineRisk === 'overdue';
  
  const currencySymbol = CURRENCIES.find(c => c.value === activity.currency)?.symbol || '$';
  const marketLabel = MARKETS.find(m => m.value === activity.market)?.label || activity.market;
  const budget = activity.approved_budget || activity.financials?.approved_budget || 0;

  const formatBudget = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toFixed(0);
  };

  const hasApproval = activity.hp_approval_email_url !== null && activity.hp_approval_email_url !== undefined;

  return (
    <div 
      className={cn(
        "kanban-card group",
        isAtRisk && "ring-2 ring-destructive/30 border-destructive/50"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              {activity.activity_id}
            </span>
            {activity.pdg_synced && (
              <CheckCircle2 className="h-3 w-3 text-success" />
            )}
            {hasApproval && (
              <Mail className="h-3 w-3 text-primary" />
            )}
          </div>
          <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {activity.name}
          </h4>
        </div>
        {isAtRisk && (
          <div className="shrink-0">
            <AlertTriangle className={cn(
              "h-4 w-4",
              deadlineRisk === 'urgent' || deadlineRisk === 'overdue' 
                ? "text-destructive animate-pulse-soft" 
                : "text-amber-500"
            )} />
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="secondary" className="text-xs font-normal">
          {activity.bu}
        </Badge>
        <Badge variant="outline" className="text-xs font-normal">
          {marketLabel}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-normal",
            activity.funding_source === 'HP' && "bg-primary/5 text-primary border-primary/20",
            activity.funding_source === 'Intel' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
            activity.funding_source === 'AMD' && "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
            activity.funding_source === 'Mixed' && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
          )}
        >
          {activity.funding_source}
        </Badge>
        <QuarterBadge quarter={activity.fiscal_quarter} />
      </div>

      {/* Budget */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-foreground">
          {currencySymbol}{formatBudget(budget)}
        </span>
        <span className="text-muted-foreground text-xs">
          approved
        </span>
      </div>

      {/* Partner (if assigned) */}
      {activity.partner && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="truncate">{activity.partner.name}</span>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{formatShortDate(activity.execution_start_date)}</span>
          <span>→</span>
          <span>{formatShortDate(activity.execution_end_date)}</span>
        </div>
        
        {/* Deadline indicator */}
        {daysRemaining !== null && (
          <DeadlineRiskBadge 
            risk={deadlineRisk} 
            daysRemaining={daysRemaining >= 0 ? daysRemaining : undefined} 
          />
        )}
      </div>
    </div>
  );
}
