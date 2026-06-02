import { Activity } from "@/types/database";
import { ActivityCard } from "./ActivityCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
}

// Six lanes covering the status_v3 progression. Multiple late-stage v3
// statuses collapse so the board doesn't fan out into nine columns.
const KANBAN_LANES: Array<{ key: string; label: string; statuses: string[]; color: string }> = [
  { key: 'not_start', label: 'Not Start',   statuses: ['Not Start'],                        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'planning',  label: 'Planning',    statuses: ['Planning'],                         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'executing', label: 'Executing',   statuses: ['Executing'],                        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { key: 'completed', label: 'Completed',   statuses: ['Activity Completed'],               color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'claiming',  label: 'Claim / POE', statuses: ['Claiming', 'POE Submitted'],        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'payment',   label: 'Payment',     statuses: ['Payment Documentation', 'Payment Submitted', 'Paid'], color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
];

export function KanbanBoard({ activities, onActivityClick }: KanbanBoardProps) {
  const getActivitiesByLane = (lane: typeof KANBAN_LANES[number]) =>
    activities.filter(a => lane.statuses.includes(a.status_v3 || 'Not Start'));

  const getLaneTotal = (lane: typeof KANBAN_LANES[number]) =>
    getActivitiesByLane(lane).reduce(
      (sum, a) => sum + (a.approved_budget || a.financials?.approved_budget || 0),
      0,
    );

  const formatTotal = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {KANBAN_LANES.map((lane) => {
          const columnActivities = getActivitiesByLane(lane);
          const columnTotal = getLaneTotal(lane);

          return (
            <div key={lane.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="flex items-center gap-2">
                  <span className={cn("status-badge", lane.color)}>
                    {lane.label}
                  </span>
                  <Badge variant="secondary" className="rounded-full h-5 px-2 text-xs">
                    {columnActivities.length}
                  </Badge>
                </div>
              </div>

              <div className="px-1 mb-3">
                <span className="text-xs text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{formatTotal(columnTotal)}</span>
                </span>
              </div>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {columnActivities.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground rounded-lg border-2 border-dashed border-border">
                    No activities
                  </div>
                ) : (
                  columnActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onClick={() => onActivityClick?.(activity)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
