import { cn } from "@/lib/utils";
import { ALL_STATUSES, getQuarterColor, ACTIVITY_STATUSES_V3 } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = ALL_STATUSES.find(s => s.value === status);
  const colorClass = statusConfig?.color || 'bg-muted text-muted-foreground';

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      colorClass,
      className
    )}>
      {status}
    </span>
  );
}

interface StatusBadgeV3Props {
  status: string;
  className?: string;
}

export function StatusBadgeV3({ status, className }: StatusBadgeV3Props) {
  const statusConfig = ACTIVITY_STATUSES_V3.find(s => s.value === status);
  const colorClass = statusConfig?.color || 'bg-muted text-muted-foreground';

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
      colorClass,
      className
    )}>
      {status}
    </span>
  );
}

interface QuarterBadgeProps {
  quarter?: string;
  className?: string;
}

export function QuarterBadge({ quarter, className }: QuarterBadgeProps) {
  if (!quarter) return null;
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      getQuarterColor(quarter),
      className
    )}>
      {quarter}
    </span>
  );
}

interface DeadlineRiskBadgeProps {
  risk: 'safe' | 'at-risk' | 'urgent' | 'overdue';
  daysRemaining?: number;
  className?: string;
}

export function DeadlineRiskBadge({ risk, daysRemaining, className }: DeadlineRiskBadgeProps) {
  const configs = {
    safe: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'On Track' },
    'at-risk': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'At Risk' },
    urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Urgent' },
    overdue: { color: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300', label: 'Overdue' },
  };

  const config = configs[risk];

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
      config.color,
      className
    )}>
      {config.label}
      {daysRemaining !== undefined && risk !== 'overdue' && (
        <span className="ml-1 opacity-80">({daysRemaining}d)</span>
      )}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = {
    Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    Normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    High: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    Urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      colors[priority],
      className
    )}>
      {priority}
    </span>
  );
}