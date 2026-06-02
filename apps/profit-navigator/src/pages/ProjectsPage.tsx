import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { useDataStore } from "@/hooks/useDataStore";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtPercent } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Lock, FileText, Clock } from "lucide-react";
import ProjectFormDialog from "@/components/forms/ProjectFormDialog";
import ProjectWizard, { loadAllDrafts, deleteDraftById, type WizardDraft } from "@/components/forms/ProjectWizard";
import type { Project } from "@/data/types";
import { useToast } from "@/hooks/use-toast";
import { CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { computeMarginSnapshots, getTrajectory, getTrajectoryColor } from "@/components/project/MarginVelocityChart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ProjectsPage() {
  const data = useAllProjectFinancials();
  const { addProject, updateProject, deleteProject, timesheets, clients } = useDataStore();
  const { hasPermission } = useAuth();
  const { fmtCurrencyWithPrefix, fmtSGD, toSGD } = useCurrency();
  const { toast } = useToast();
  const canEdit = hasPermission("edit_projects");
  const canDelete = hasPermission("delete_projects");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [resumeDraftId, setResumeDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<WizardDraft[]>(() => loadAllDrafts());

  const refreshDrafts = useCallback(() => setDrafts(loadAllDrafts()), []);

  // Sort newest-first by start_date, then project_code descending
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.project.start_date).getTime();
      const dateB = new Date(b.project.start_date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.project.project_code.localeCompare(a.project.project_code);
    });
  }, [data]);

  function handleNew() {
    setResumeDraftId(null);
    setWizardOpen(true);
  }
  function handleResumeDraft(id: string) {
    setResumeDraftId(id);
    setWizardOpen(true);
  }
  function handleDeleteDraft(id: string) {
    deleteDraftById(id);
    refreshDrafts();
    toast({ title: "Draft deleted" });
  }
  function handleWizardClose(open: boolean) {
    setWizardOpen(open);
    if (!open) {
      setResumeDraftId(null);
      refreshDrafts();
    }
  }
  function handleEdit(e: React.MouseEvent, p: Project) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(p);
    setEditDialogOpen(true);
  }
  async function handleDelete(e: React.MouseEvent, p: Project) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteProject(p.project_id);
      toast({ title: "Project deleted" });
    } catch (err: any) {
      toast({
        title: "Could not delete project",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    }
  }
  async function handleSave(d: Omit<Project, "project_id" | "project_code">) {
    if (editing) {
      await updateProject(editing.project_id, d);
    } else {
      await addProject(d);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{sortedData.length} active projects · sorted newest first</p>
        </div>
        {canEdit ? (
          <button onClick={handleNew} className="btn-primary">
            <Plus className="h-4 w-4" />New Project
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> View only</span>
        )}
      </div>

      {/* Saved Drafts */}
      {canEdit && drafts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Saved Drafts ({drafts.length})
          </h2>
          <div className="grid gap-2">
            {drafts.map(draft => {
              const clientName = clients.find(c => c.client_id === draft.basics.client_id)?.client_name || "—";
              const stepLabel = ["Basics", "Commercial", "Stakeholders", "Budget", "Review"][draft.step] || "Basics";
              return (
                <div
                  key={draft.id}
                  className="glass-card p-4 flex items-center justify-between border-dashed"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {draft.basics.project_name || "Untitled Draft"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{clientName}</Badge>
                        <Badge variant="secondary" className="text-[10px]">Step: {stepLabel}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {timeAgo(draft.savedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleResumeDraft(draft.id)}>
                      Resume
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDraft(draft.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {sortedData.map(({ project, client, financials }) => {
          const cur = project.currency || "SGD";
          const prefix = CURRENCY_SYMBOLS[cur] || cur;
          return (
            <Link key={project.project_id} to={`/projects/${project.project_id}?from=projects`}>
              <div className="glass-card p-5 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{project.project_name}</h3>
                      {(() => {
                        const pTs = timesheets.filter(t => t.project_id === project.project_id);
                        const snaps = computeMarginSnapshots(project, pTs);
                        if (snaps.length < 2) return null;
                        const traj = getTrajectory(snaps, project.margin_target_percent);
                        const color = getTrajectoryColor(traj);
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: color }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">{traj}</TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{client?.client_name}</Badge>
                      <Badge variant="outline" className="text-xs">{project.commercial_model === "PARTNER_PASS_THROUGH" ? "Pass-Through" : "Enfactum-Led"}</Badge>
                      <Badge variant="secondary" className="text-xs">{project.invoice_model}</Badge>
                      <Badge variant="outline" className="text-xs">Currency: {prefix}</Badge>
                      {project.sales_person && <Badge variant="outline" className="text-xs">Sales: {project.sales_person}</Badge>}
                      <span className={`badge-${project.status === "ACTIVE" ? "positive" : "warning"}`}>{project.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleEdit(e, project)}><Pencil className="h-3.5 w-3.5" /></Button>}
                    {canDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => handleDelete(e, project)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    <div className="text-right ml-2">
                      <div className="text-lg font-bold tabular-nums mono">{fmtCurrencyWithPrefix(financials.revenueUsed, cur)}</div>
                      <div className="text-xs text-muted-foreground">GM: <span className="mono">{fmtPercent(financials.grossMarginPct)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t text-sm" style={{ borderColor: "var(--glass-border)" }}>
                  <div><span className="text-muted-foreground text-xs">Internal Cost</span><div className="tabular-nums font-medium mono">{fmtCurrencyWithPrefix(financials.internalCost, cur)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Vendor Cost</span><div className="tabular-nums font-medium mono">{fmtCurrencyWithPrefix(financials.vendorCost, cur)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Gross Margin</span><div className="tabular-nums font-medium mono">{fmtCurrencyWithPrefix(financials.grossMargin, cur)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Net After Payouts</span><div className="tabular-nums font-bold mono">{fmtCurrencyWithPrefix(financials.netMarginAfterPayouts, cur)}</div></div>
                </div>
                {cur !== "SGD" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Normalized: Revenue {fmtSGD(toSGD(financials.revenueUsed, cur))} · GM {fmtSGD(toSGD(financials.grossMargin, cur))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <ProjectWizard open={wizardOpen} onOpenChange={handleWizardClose} draftId={resumeDraftId} />
      <ProjectFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} project={editing} onSave={handleSave} />
    </div>
  );
}
