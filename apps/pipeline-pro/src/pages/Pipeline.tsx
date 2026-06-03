import { useState, useMemo, useCallback } from 'react';
import { useDeals, useUpdateDeal } from '@/hooks/useDeals';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logEvent } from '@/lib/events';
import { STAGES_ORDERED, Stage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutGrid, Table as TableIcon, Search, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LossReasonDialog } from '@/components/LossReasonDialog';
import { CreateDealDialog } from '@/components/CreateDealDialog';
import { KanbanView } from '@/components/pipeline/KanbanView';
import { ClientsView } from '@/components/pipeline/ClientsView';
import { PipelineTable } from '@/components/pipeline/PipelineTable';

type ViewMode = 'kanban' | 'table' | 'clients';

export default function Pipeline() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const { data: deals = [], isLoading } = useDeals();
  const updateDeal = useUpdateDeal();
  const { employee } = useEmployee();
  const { canWrite } = useAuth();

  const [lossDialog, setLossDialog] = useState<{ open: boolean; dealId: string; dealTitle: string; fromStage: string }>({
    open: false, dealId: '', dealTitle: '', fromStage: '',
  });
  const [lossLoading, setLossLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const owners = useMemo(() => {
    const set = new Set<string>();
    deals.forEach(d => { if (d.owner_name) set.add(d.owner_name); });
    return Array.from(set).sort();
  }, [deals]);

  const filtered = useMemo(() => {
    let result = deals;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.account_name?.toLowerCase().includes(q) ||
        o.owner_name?.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== 'all') {
      result = result.filter(o => o.stage === stageFilter);
    }
    if (ownerFilter !== 'all') {
      result = result.filter(o => o.owner_name === ownerFilter);
    }
    return result;
  }, [deals, search, stageFilter, ownerFilter]);

  const handleStageChange = useCallback((dealId: string, newStage: Stage) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    if (!canWrite) {
      toast.error('Read-only access — ask an admin to upgrade your access level.');
      return;
    }
    const oldStage = deal.stage || 'Unknown';

    if (newStage === 'Lost') {
      setLossDialog({ open: true, dealId, dealTitle: deal.title, fromStage: oldStage });
      return;
    }

    updateDeal.mutate(
      { id: dealId, updates: { stage: newStage } },
      {
        onSuccess: () => {
          logEvent({
            entity_type: 'deal',
            entity_id: dealId,
            event_type: newStage === 'Closed' ? 'deal.won' : 'deal.stage_changed',
            payload: newStage === 'Closed'
              ? { value: deal.value, account_name: deal.account_name, margin_gp_percent: deal.margin_gp_percent ?? deal.gp_percent }
              : { from: oldStage, to: newStage, value: deal.value },
            actor_id: employee?.id,
          });

          if (newStage === 'Closed') {
            toast.success(`🎉 Deal won! "${deal.title}"`);
          } else {
            toast.success(`Moved "${deal.title}" to ${newStage}`);
          }
        },
        onError: (err) => {
          toast.error('Failed to update stage: ' + (err as Error).message);
        },
      }
    );
  }, [deals, updateDeal, employee, canWrite]);

  const handleLossConfirm = useCallback(async (reason: string) => {
    const { dealId, fromStage } = lossDialog;
    const deal = deals.find(d => d.id === dealId);
    setLossLoading(true);

    updateDeal.mutate(
      { id: dealId, updates: { stage: 'Lost' } },
      {
        onSuccess: () => {
          const createdAt = deal?.deal_created_at ? new Date(deal.deal_created_at) : null;
          const daysInPipeline = createdAt
            ? Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          logEvent({
            entity_type: 'deal',
            entity_id: dealId,
            event_type: 'deal.lost',
            payload: {
              value: deal?.value,
              loss_reason: reason,
              days_in_pipeline: daysInPipeline,
              from_stage: fromStage,
            },
            actor_id: employee?.id,
          });

          toast.error(`Deal "${deal?.title}" marked as Lost — ${reason}`);
          setLossDialog({ open: false, dealId: '', dealTitle: '', fromStage: '' });
          setLossLoading(false);
        },
        onError: (err) => {
          toast.error('Failed to update: ' + (err as Error).message);
          setLossLoading(false);
        },
      }
    );
  }, [lossDialog, deals, updateDeal, employee]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pipeline</h1>
        <Button size="sm" className="h-8 text-xs" disabled={!canWrite} onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3 mr-1" />Add Opportunity</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm bg-card" />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-card px-2.5 text-xs"
        >
          <option value="all">All stages</option>
          {STAGES_ORDERED.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-card px-2.5 text-xs"
        >
          <option value="all">All owners</option>
          {owners.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex border border-input rounded-md overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn('px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors',
              viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
            )}
          >
            <LayoutGrid className="h-3 w-3" />Kanban
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn('px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors',
              viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
            )}
          >
            <TableIcon className="h-3 w-3" />Table
          </button>
          <button
            onClick={() => setViewMode('clients')}
            className={cn('px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors',
              viewMode === 'clients' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
            )}
          >
            <Building2 className="h-3 w-3" />Clients
          </button>
        </div>
      </div>

{viewMode === 'kanban' && <KanbanView deals={filtered} onStageChange={handleStageChange} />}
      {viewMode === 'table' && <PipelineTable deals={filtered} />}
      {viewMode === 'clients' && <ClientsView deals={filtered} onStageChange={handleStageChange} />}
      
      <LossReasonDialog
        open={lossDialog.open}
        onClose={() => setLossDialog(d => ({ ...d, open: false }))}
        onConfirm={handleLossConfirm}
        dealTitle={lossDialog.dealTitle}
        saving={lossLoading}
      />

      <CreateDealDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
