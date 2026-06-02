import { Link } from 'react-router-dom';
import { formatSGD } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DbVDeal } from '@/integrations/supabase/db';

export function MarginIndicator({ deal }: { deal: DbVDeal }) {
  const gp = deal.margin_gp_percent ?? deal.gp_percent;
  const hasMargin = gp != null || deal.margin_revenue != null || deal.revenue != null;

  if (!hasMargin) {
    return (
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground">No margin data</span>
        <Link to={`/opportunity/${deal.id}`} className="text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
          Add margin →
        </Link>
      </div>
    );
  }

  const gpValue = gp ?? 0;
  const variant = gpValue >= 20 ? 'success' : gpValue >= 12 ? 'warning' : 'destructive';
  const approved = deal.margin_approved;

  return (
    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/20">
      <Badge variant={variant} className="text-[10px] px-1.5 py-0 font-mono">
        GP: {gpValue.toFixed(1)}%
      </Badge>
      {approved === false && (
        <span className="text-[10px] text-warning">⏳ Pending</span>
      )}
      {approved === true && (
        <span className="text-[10px] text-success">✓ Approved</span>
      )}
    </div>
  );
}

export function MdfBadge({ deal }: { deal: DbVDeal }) {
  if (!deal.mdf_eligible) return null;
  const estAmount = deal.mdf_amount ? formatSGD(deal.mdf_amount) : 'TBD';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">
            🏷️ MDF
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          HP/Lenovo MDF eligible — est. {estAmount}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KanbanCardContent({ deal, isDragging, dragListeners }: { deal: DbVDeal; isDragging?: boolean; dragListeners?: any }) {
  return (
    <div className={cn('kanban-card group', isDragging && 'ring-2 ring-primary shadow-lg shadow-primary/20 rotate-1')}>
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity flex-shrink-0 text-muted-foreground"
          {...dragListeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/opportunity/${deal.id}`} className="text-sm font-medium leading-tight hover:text-primary transition-colors" onClick={e => isDragging && e.preventDefault()}>
              {deal.title}
            </Link>
            <MdfBadge deal={deal} />
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">{deal.account_name}</p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold sgd-value">{formatSGD(deal.value ?? 0)}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{Math.round((deal.win_probability ?? 0) * 100)}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{deal.owner_name}</p>
          <MarginIndicator deal={deal} />
        </div>
      </div>
    </div>
  );
}
