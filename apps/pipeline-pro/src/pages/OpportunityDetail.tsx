import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDeal } from '@/hooks/useDeals';
import { useAccount } from '@/hooks/useAccounts';
import { useEmployee } from '@/contexts/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { formatSGD } from '@/lib/format';
import { logEvent } from '@/lib/events';
import { detectMdfEligibility, PRODUCT_LINE_OPTIONS } from '@/lib/mdf';
import { StageBadge } from '@/components/StatusBadges';
import ActivityTimeline from '@/components/ActivityTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, DollarSign, TrendingUp, Save, Tag, ChevronDown, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentsTab } from '@/components/account/DocumentsTab';

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading } = useDeal(id);
  const { employee } = useEmployee();
  const { canWrite } = useAuth();
  const queryClient = useQueryClient();

  // Load account for vendor_flags
  const { data: account } = useAccount(deal?.account_id ?? undefined);

  // Margin form state
  const [showMarginForm, setShowMarginForm] = useState(false);
  const [marginForm, setMarginForm] = useState({
    revenue: '',
    cost_of_goods: '',
    cost_of_services: '',
    mdf_subsidy: '0',
    pricing_notes: '',
  });
  const [saving, setSaving] = useState(false);

  // MDF edit state
  const [editingMdf, setEditingMdf] = useState(false);
  const [mdfForm, setMdfForm] = useState({
    product_lines: [] as string[],
    mdf_eligible: false,
    mdf_amount: '',
  });
  const [savingMdf, setSavingMdf] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6">
        <Link to="/pipeline" className="text-primary hover:underline text-sm">← Back to Pipeline</Link>
        <p className="mt-2">Deal not found.</p>
      </div>
    );
  }

  const weighted = (deal.value ?? 0) * (deal.win_probability ?? 0);
  const hasMargin = deal.margin_revenue != null || deal.revenue != null;
  const gpPercent = deal.margin_gp_percent ?? deal.gp_percent;
  const gpVariant = gpPercent != null
    ? (gpPercent >= 20 ? 'success' : gpPercent >= 12 ? 'warning' : 'destructive')
    : 'secondary';

  // MDF-adjusted GP%
  const marginRevenue = deal.margin_revenue ?? deal.revenue ?? 0;
  const marginGp = deal.margin_gp ?? deal.gross_profit ?? 0;
  const mdfAdjustedGp = marginRevenue > 0
    ? ((marginGp + (deal.mdf_amount ?? 0)) / marginRevenue) * 100
    : null;

  const productLines: string[] = Array.isArray(deal.product_lines) ? deal.product_lines : [];

  const handleStartMdfEdit = () => {
    setMdfForm({
      product_lines: productLines,
      mdf_eligible: deal.mdf_eligible ?? false,
      mdf_amount: String(deal.mdf_amount ?? ''),
    });
    setEditingMdf(true);
  };

  const handleProductLineToggle = (pl: string) => {
    setMdfForm(f => {
      const updated = f.product_lines.includes(pl)
        ? f.product_lines.filter(p => p !== pl)
        : [...f.product_lines, pl];
      const autoEligible = detectMdfEligibility(account?.vendor_flags, updated);
      return { ...f, product_lines: updated, mdf_eligible: autoEligible || f.mdf_eligible };
    });
  };

  const handleSaveMdf = async () => {
    setSavingMdf(true);
    try {
      const updates: Record<string, any> = {
        product_lines: mdfForm.product_lines,
        mdf_eligible: mdfForm.mdf_eligible,
        mdf_amount: parseFloat(mdfForm.mdf_amount) || null,
      };

      const { error } = await db
        .from('deals')
        .update(updates)
        .eq('id', deal.id);

      if (error) throw error;

      // Log MDF flagged event if eligible
      if (mdfForm.mdf_eligible) {
        logEvent({
          module: 'enalloy',
          entity_type: 'deal',
          entity_id: deal.id,
          event_type: 'deal.mdf_flagged',
          payload: {
            product_lines: mdfForm.product_lines,
            estimated_mdf_amount: parseFloat(mdfForm.mdf_amount) || 0,
            account_vendor_flags: account?.vendor_flags ?? null,
          },
          actor_id: employee?.id,
        });
      }

      // Log deal.updated event for MDF field changes
      logEvent({
        entity_type: 'deal',
        entity_id: deal.id,
        event_type: 'deal.updated',
        payload: {
          changed_fields: {
            product_lines: { from: productLines, to: mdfForm.product_lines },
            mdf_eligible: { from: deal.mdf_eligible, to: mdfForm.mdf_eligible },
            mdf_amount: { from: deal.mdf_amount, to: parseFloat(mdfForm.mdf_amount) || null },
          },
        },
        actor_id: employee?.id,
      });

      toast.success('MDF details updated');
      setEditingMdf(false);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (err: any) {
      toast.error('Failed to update MDF: ' + err.message);
    } finally {
      setSavingMdf(false);
    }
  };

  const handleCreateMargin = async () => {
    const revenue = parseFloat(marginForm.revenue) || 0;
    const cogs = parseFloat(marginForm.cost_of_goods) || 0;
    const cos = parseFloat(marginForm.cost_of_services) || 0;
    const mdf = parseFloat(marginForm.mdf_subsidy) || 0;
    const grossProfit = revenue - cogs - cos + mdf;
    const gpPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    setSaving(true);
    try {
      const { data: marginData, error: marginError } = await db
        .from('margins')
        .insert({
          deal_id: deal.id,
          revenue,
          cost_of_goods: cogs,
          cost_of_services: cos,
          mdf_subsidy: mdf,
          gross_profit: grossProfit,
          gp_percent: gpPct,
          approved: false,
        })
        .select()
        .single();

      if (marginError) throw marginError;

      logEvent({
        module: 'enedge',
        entity_type: 'margin',
        entity_id: (marginData as any)?.id,
        event_type: 'margin.created',
        payload: { deal_id: deal.id, revenue, gp_percent: gpPct },
        actor_id: employee?.id,
      });

      // Also log as deal timeline event
      logEvent({
        entity_type: 'deal',
        entity_id: deal.id,
        event_type: 'margin.created',
        payload: { revenue, gp_percent: gpPct },
        actor_id: employee?.id,
      });

      if (gpPct < 15) {
        toast.warning('⚠️ This deal is below the 15% margin floor. Consider reviewing pricing before advancing.', { duration: 6000 });
      } else {
        toast.success('Margin record created');
      }

      setShowMarginForm(false);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (err: any) {
      toast.error('Failed to create margin: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in">
      <Link to="/pipeline" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Pipeline
      </Link>

      {/* Header card */}
      <div className="data-panel header-stripe">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold">{deal.title}</h1>
            <p className="text-xs text-muted-foreground">
              {deal.account_id && (
                <Link to={`/accounts/${deal.account_id}`} className="text-primary hover:underline">{deal.account_name}</Link>
              )}
              {deal.industry && ` · ${deal.industry}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StageBadge stage={deal.stage || 'Prospect'} />
            {deal.mdf_eligible && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">
                🏷️ MDF
              </Badge>
            )}
            {gpPercent != null && (
              <Badge variant={gpVariant as any} className="text-[10px] px-1.5 py-0 font-mono">
                GP: {gpPercent.toFixed(1)}%
              </Badge>
            )}
            {deal.margin_approved === false && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">⏳ Pending approval</Badge>
            )}
            {deal.margin_approved === true && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">✓ Approved</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-4 pt-4 border-t border-border/40">
          {[
            { label: 'Value', value: formatSGD(deal.value ?? 0), mono: true },
            { label: 'Win Probability', value: `${Math.round((deal.win_probability ?? 0) * 100)}%` },
            { label: 'Weighted', value: formatSGD(weighted), mono: true },
            { label: 'Owner', value: deal.owner_name || '—' },
            { label: 'GP%', value: gpPercent != null ? `${gpPercent.toFixed(1)}%` : '—' },
            { label: 'Expected Close', value: deal.expected_close_date || '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="section-label">{item.label}</p>
              <p className={`text-sm font-semibold mt-0.5 ${item.mono ? 'sgd-value' : ''}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-card border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="margin" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />Margin
          </TabsTrigger>
          <TabsTrigger value="mdf" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />MDF
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />Timeline
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-3 mt-3">
          {deal.description && (
            <div className="data-panel">
              <h3 className="consulting-headline mb-1.5">Description</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{deal.description}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="data-panel">
              <h3 className="consulting-headline mb-1.5">Details</h3>
              <div className="space-y-1.5 text-sm">
                <div><span className="text-muted-foreground">Currency:</span> {deal.currency || 'SGD'}</div>
                <div><span className="text-muted-foreground">MDF Eligible:</span> {deal.mdf_eligible ? 'Yes' : 'No'}</div>
                {deal.mdf_amount && <div><span className="text-muted-foreground">MDF Amount:</span> {formatSGD(deal.mdf_amount)}</div>}
                {productLines.length > 0 && (
                  <div className="flex items-start gap-1">
                    <span className="text-muted-foreground">Product Lines:</span>
                    <div className="flex flex-wrap gap-1">
                      {productLines.map(pl => (
                        <Badge key={pl} variant="secondary" className="text-[10px] px-1.5 py-0">{pl}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Margin Tab ── */}
        <TabsContent value="margin" className="space-y-3 mt-3">
          {hasMargin ? (
            <div className="data-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="consulting-headline flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />Margin & Profitability
                </h3>
                <div className="flex items-center gap-2">
                  {deal.margin_approved === true && <Badge variant="success" className="text-[10px]">✓ Approved</Badge>}
                  {deal.margin_approved === false && <Badge variant="warning" className="text-[10px]">⏳ Pending approval</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Revenue', value: formatSGD(deal.margin_revenue ?? deal.revenue ?? 0) },
                  { label: 'Cost of Goods', value: formatSGD(deal.cost_of_goods ?? 0) },
                  { label: 'Cost of Services', value: formatSGD(deal.cost_of_services ?? 0) },
                  { label: 'MDF Subsidy', value: formatSGD(deal.mdf_subsidy ?? 0) },
                  { label: 'Gross Profit', value: formatSGD(deal.margin_gp ?? deal.gross_profit ?? 0) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="section-label">{item.label}</p>
                    <p className="sgd-value font-semibold mt-0.5 text-sm">{item.value}</p>
                  </div>
                ))}
                <div>
                  <p className="section-label">GP %</p>
                  <div className="mt-0.5">
                    {gpPercent != null ? (
                      <Badge variant={gpVariant as any} className="text-xs font-mono px-2 py-0.5">{gpPercent.toFixed(1)}%</Badge>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>
              {gpPercent != null && gpPercent < 15 && (
                <div className="mt-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  ⚠️ This deal is below the 15% margin floor. Consider reviewing pricing before advancing.
                </div>
              )}
            </div>
          ) : (
            <div className="data-panel">
              <h3 className="consulting-headline flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4" />Add Margin Data
              </h3>
              <p className="text-xs text-muted-foreground mb-4">No margin record exists for this deal.</p>
              {!showMarginForm ? (
                <Button onClick={() => { setMarginForm(f => ({ ...f, revenue: String(deal.value ?? '') })); setShowMarginForm(true); }} disabled={!canWrite} className="text-xs h-8">
                  <DollarSign className="h-3 w-3 mr-1" />Add Margin Record
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'revenue', label: 'Revenue (SGD)' },
                      { key: 'cost_of_goods', label: 'Cost of Goods' },
                      { key: 'cost_of_services', label: 'Cost of Services' },
                      { key: 'mdf_subsidy', label: 'MDF Subsidy' },
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="section-label">{field.label}</label>
                        <Input
                          type="number"
                          value={(marginForm as any)[field.key]}
                          onChange={e => setMarginForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder="0"
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const rev = parseFloat(marginForm.revenue) || 0;
                    const cogs = parseFloat(marginForm.cost_of_goods) || 0;
                    const cos = parseFloat(marginForm.cost_of_services) || 0;
                    const mdf = parseFloat(marginForm.mdf_subsidy) || 0;
                    const gp = rev - cogs - cos + mdf;
                    const gpPct = rev > 0 ? (gp / rev) * 100 : 0;
                    const previewVariant = gpPct >= 20 ? 'success' : gpPct >= 12 ? 'warning' : 'destructive';
                    return rev > 0 ? (
                      <div className="p-3 rounded bg-muted/50 border border-border/40 flex items-center gap-4 text-sm">
                        <div><span className="text-muted-foreground">GP: </span><span className="sgd-value font-semibold">{formatSGD(gp)}</span></div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">GP%: </span>
                          <Badge variant={previewVariant as any} className="text-xs font-mono px-2 py-0.5">{gpPct.toFixed(1)}%</Badge>
                        </div>
                        {gpPct < 15 && <span className="text-[11px] text-destructive">⚠️ Below 15% floor</span>}
                      </div>
                    ) : null;
                  })()}
                  <div className="space-y-1">
                    <label className="section-label">Pricing Notes</label>
                    <Textarea value={marginForm.pricing_notes} onChange={e => setMarginForm(f => ({ ...f, pricing_notes: e.target.value }))} placeholder="Any notes on pricing rationale..." className="text-sm bg-muted min-h-[80px]" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateMargin} disabled={saving} className="text-xs h-8"><Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save Margin'}</Button>
                    <Button variant="ghost" onClick={() => setShowMarginForm(false)} className="text-xs h-8">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── MDF Tab ── */}
        <TabsContent value="mdf" className="space-y-3 mt-3">
          {!editingMdf ? (
            <div className="data-panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="consulting-headline flex items-center gap-2"><Tag className="h-4 w-4" />MDF Opportunity</h3>
                <Button size="sm" variant="outline" onClick={handleStartMdfEdit} disabled={!canWrite} className="text-xs h-7">Edit MDF</Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="section-label">MDF Eligible</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {deal.mdf_eligible ? <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10">Yes</Badge> : 'No'}
                  </p>
                </div>
                <div>
                  <p className="section-label">Estimated MDF Amount</p>
                  <p className="sgd-value font-semibold mt-0.5 text-sm">{deal.mdf_amount ? formatSGD(deal.mdf_amount) : '—'}</p>
                </div>
                <div>
                  <p className="section-label">Product Lines</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {productLines.length > 0
                      ? productLines.map(pl => <Badge key={pl} variant="secondary" className="text-[10px] px-1.5 py-0">{pl}</Badge>)
                      : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
                <div>
                  <p className="section-label">MDF-Adjusted GP%</p>
                  <div className="mt-0.5">
                    {hasMargin && mdfAdjustedGp != null ? (
                      <Badge variant={mdfAdjustedGp >= 20 ? 'success' : mdfAdjustedGp >= 12 ? 'warning' : 'destructive'} className="text-xs font-mono px-2 py-0.5">
                        {mdfAdjustedGp.toFixed(1)}%
                      </Badge>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="data-panel">
              <h3 className="consulting-headline flex items-center gap-2 mb-4"><Tag className="h-4 w-4" />Edit MDF Details</h3>
              <div className="space-y-2 mb-4">
                <label className="section-label">Product Lines</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_LINE_OPTIONS.map(pl => {
                    const selected = mdfForm.product_lines.includes(pl);
                    return (
                      <button
                        key={pl}
                        type="button"
                        onClick={() => handleProductLineToggle(pl)}
                        className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {pl}
                        {selected && <X className="h-2.5 w-2.5 ml-1 inline" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <label className="section-label">MDF Eligible</label>
                <Switch checked={mdfForm.mdf_eligible} onCheckedChange={v => setMdfForm(f => ({ ...f, mdf_eligible: v }))} />
                <span className="text-xs text-muted-foreground">
                  {detectMdfEligibility(account?.vendor_flags, mdfForm.product_lines)
                    ? '(Auto-detected)' : '(Manual override)'}
                </span>
              </div>
              {mdfForm.mdf_eligible && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-foreground/80 mb-2">
                    <ChevronDown className="h-3 w-3" />MDF Funding Details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pl-4 border-l-2 border-amber-500/30">
                    <div className="space-y-1 max-w-xs">
                      <label className="section-label">Estimated MDF Amount (SGD)</label>
                      <Input type="number" value={mdfForm.mdf_amount} onChange={e => setMdfForm(f => ({ ...f, mdf_amount: e.target.value }))} placeholder="0" className="h-8 text-sm bg-muted" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                      This deal may qualify for vendor MDF funding. The MDF-adjusted margin will be calculated in the profitability section.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveMdf} disabled={savingMdf} className="text-xs h-8"><Save className="h-3 w-3 mr-1" />{savingMdf ? 'Saving...' : 'Save MDF'}</Button>
                <Button variant="ghost" onClick={() => setEditingMdf(false)} className="text-xs h-8">Cancel</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Timeline Tab ── */}
        <TabsContent value="documents" className="mt-3">
          <div className="data-panel">
            {deal.account_id && (
              <DocumentsTab dealId={deal.id} accountId={deal.account_id} />
            )}
          </div>
        </TabsContent>
        <TabsContent value="timeline" className="mt-3">
          <ActivityTimeline entityType="deal" entityId={deal.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
