import { formatDistanceToNow, parseISO } from 'date-fns';
import { useEntityEvents, type DbEvent } from '@/hooks/useEvents';
import { useEmployees } from '@/hooks/useEmployees';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Trophy, XCircle, Edit, Plus, TrendingUp, Tag, DollarSign,
} from 'lucide-react';

const EVENT_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  label: string;
  describe: (p: Record<string, any>) => string;
}> = {
  'deal.created': {
    icon: Plus,
    color: 'text-primary',
    label: 'Deal Created',
    describe: (p) => `Created deal "${p.title}" in ${p.stage} stage`,
  },
  'deal.stage_changed': {
    icon: ArrowRight,
    color: 'text-blue-400',
    label: 'Stage Changed',
    describe: (p) => `Moved from ${p.from} to ${p.to}`,
  },
  'deal.updated': {
    icon: Edit,
    color: 'text-muted-foreground',
    label: 'Deal Updated',
    describe: (p) => {
      const fields = p.changed_fields;
      if (!fields) return 'Updated deal fields';
      const keys = Object.keys(fields);
      return `Updated ${keys.join(', ')}`;
    },
  },
  'deal.won': {
    icon: Trophy,
    color: 'text-emerald-400',
    label: '🎉 Deal Won',
    describe: (p) => `Deal won — ${p.account_name || ''} — Value: $${(p.value ?? 0).toLocaleString()}`,
  },
  'deal.lost': {
    icon: XCircle,
    color: 'text-destructive',
    label: 'Deal Lost',
    describe: (p) => `Deal marked as Lost${p.loss_reason ? ` — Reason: ${p.loss_reason}` : ''}`,
  },
  'deal.mdf_flagged': {
    icon: Tag,
    color: 'text-amber-400',
    label: 'MDF Flagged',
    describe: (p) => `MDF eligibility detected — est. $${(p.estimated_mdf_amount ?? 0).toLocaleString()}`,
  },
  'margin.created': {
    icon: DollarSign,
    color: 'text-emerald-400',
    label: 'Margin Created',
    describe: (p) => `Margin record created — GP: ${(p.gp_percent ?? 0).toFixed(1)}%`,
  },
  'account.created': {
    icon: Plus,
    color: 'text-primary',
    label: 'Account Created',
    describe: (p) => `Account "${p.name}" created`,
  },
  'account.updated': {
    icon: Edit,
    color: 'text-muted-foreground',
    label: 'Account Updated',
    describe: (p) => {
      const fields = p.changed_fields;
      if (!fields) return 'Updated account fields';
      return `Updated ${Object.keys(fields).join(', ')}`;
    },
  },
};

function getConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? {
    icon: Edit,
    color: 'text-muted-foreground',
    label: eventType,
    describe: () => eventType,
  };
}

export default function ActivityTimeline({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data: events = [], isLoading } = useEntityEvents(entityType, entityId);
  const { data: employees = [] } = useEmployees();

  const employeeMap = new Map(employees.map(e => [e.id, e.name]));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="data-panel text-center py-12">
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="data-panel">
      <h3 className="consulting-headline mb-4">Activity Timeline</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/50" />

        <div className="space-y-4">
          {events.map((event) => {
            const config = getConfig(event.event_type ?? '');
            const Icon = config.icon;
            const payload = (event.payload ?? {}) as Record<string, any>;
            const actorName = event.actor_id ? employeeMap.get(event.actor_id) : null;
            const timeAgo = event.occurred_at
              ? formatDistanceToNow(parseISO(event.occurred_at), { addSuffix: true })
              : '';

            return (
              <div key={event.id} className="flex gap-3 relative">
                <div className={`flex-shrink-0 w-[30px] h-[30px] rounded-full bg-card border border-border/50 flex items-center justify-center z-10 ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
                    {config.describe(payload)}
                  </p>
                  {actorName && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">by {actorName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
