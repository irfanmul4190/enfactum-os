import { useState } from 'react';
import { formatSGD } from '@/lib/format';
import { StageBadge } from '@/components/StatusBadges';
import { STAGES_ORDERED, type Stage } from '@/types';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { DbVDeal } from '@/integrations/supabase/db';
import { KanbanCardContent } from './KanbanCard';

function SortableKanbanCard({ deal }: { deal: DbVDeal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCardContent deal={deal} dragListeners={listeners} />
    </div>
  );
}

function KanbanColumn({ stage, deals }: { stage: Stage; deals: DbVDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);
  const dealIds = deals.map(d => d.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'kanban-column transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
        <div>
          <StageBadge stage={stage} />
          <p className="text-[11px] text-muted-foreground mt-1">{deals.length} deals · {formatSGD(totalValue)}</p>
        </div>
      </div>
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[60px]">
          {deals.map(deal => (
            <SortableKanbanCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-8 opacity-50">Drop deals here</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface KanbanViewProps {
  deals: DbVDeal[];
  onStageChange: (dealId: string, newStage: Stage) => void;
}

export function KanbanView({ deals, onStageChange }: KanbanViewProps) {
  const kanbanStages = STAGES_ORDERED.filter(s => !['Closed', 'Lost'].includes(s));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    let targetStage: Stage | undefined;
    if (kanbanStages.includes(over.id as Stage)) {
      targetStage = over.id as Stage;
    } else {
      const overDeal = deals.find(d => d.id === over.id);
      if (overDeal) targetStage = overDeal.stage as Stage;
    }

    if (targetStage && targetStage !== deal.stage) {
      onStageChange(dealId, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {kanbanStages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          return <KanbanColumn key={stage} stage={stage} deals={stageDeals} />;
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeDeal ? <KanbanCardContent deal={activeDeal} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
