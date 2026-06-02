import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchContractById } from "@/lib/contracts";
import { useEmployee } from "@/hooks/useEmployee";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusPipeline } from "@/components/StatusPipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Pencil, ChevronRight, Copy, Trash2, Upload, FileText,
  ExternalLink, Download, Clock, User, BookmarkPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STATUS_PIPELINE } from "@/lib/types";
import type { ContractView, ContractEvent, Deliverable } from "@/lib/types";

import { fmtSGD as fmtCurrency, fmtDate, fmtDateTime } from "@/lib/format";
function humanEvent(t: string) {
  const map: Record<string, string> = {
    "contract.created": "Contract created",
    "contract.updated": "Contract updated",
    "contract.status_changed": "Status changed",
    "contract.deleted": "Contract deleted",
    "contract.duplicated": "Contract duplicated",
    "deal.stage_changed": "Deal stage changed",
  };
  return map[t] || t;
}

const demoBase = {
  renewal_date: null, account_id: "a1", deal_id: "d1", owner_id: "e1",
  scope_summary: "End-to-end digital transformation including cloud migration, application modernization, and data platform implementation.",
  deliverables: [
    { title: "Cloud Migration Plan", description: "Detailed migration roadmap", completed: true },
    { title: "Application Modernization", description: "Refactoring legacy systems", completed: false },
    { title: "Data Platform Build", description: "New analytics platform", completed: false },
  ] as Deliverable[],
  payment_terms: "Net 30",
  client_signer_name: "John Smith", client_signer_email: "john@acme.com",
  enfactum_signer_id: "e1", internal_notes: "High priority client. CTO is the main stakeholder.",
  file_url: null, signed_file_url: null, signed_at: null,
};

const DEMO_CONTRACT: ContractView = {
  ...demoBase,
  id: "1", title: "Master Services Agreement — Acme Corp", type: "MSA", status: "active",
  value: 500000, currency: "SGD", start_date: "2025-01-01", end_date: "2025-12-31",
  auto_renew: true, account_name: "Acme Corp", deal_title: "Acme Digital Transformation",
  owner_name: "Rahul Sharma", created_at: "2025-01-01",
};

const DEMO_EVENTS: ContractEvent[] = [
  { id: "ev1", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.created", payload: { title: "MSA — Acme Corp", type: "MSA", status: "draft" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: "2025-01-01T09:00:00Z" },
  { id: "ev2", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.status_changed", payload: { from: "draft", to: "internal_review" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: "2025-01-02T10:30:00Z" },
  { id: "ev3", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.status_changed", payload: { from: "internal_review", to: "sent_to_client" }, actor_id: "e2", actor_name: "Priya Patel", created_at: "2025-01-03T14:00:00Z" },
  { id: "ev4", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.status_changed", payload: { from: "sent_to_client", to: "signed" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: "2025-01-10T11:00:00Z" },
  { id: "ev5", module: "enforge", entity_type: "contract", entity_id: "1", event_type: "contract.status_changed", payload: { from: "signed", to: "active" }, actor_id: "e1", actor_name: "Rahul Sharma", created_at: "2025-01-15T09:00:00Z" },
];

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { employee } = useEmployee();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesLoaded, setNotesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signedFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch contract from view
  const { data: contract, isLoading } = useQuery<ContractView | null>({
    queryKey: ["contract", id],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_CONTRACT;
      return fetchContractById(id!);
    },
  });

  // Sync notes
  if (contract && !notesLoaded) {
    setNotes(contract.internal_notes || "");
    setNotesLoaded(true);
  }

  // Fetch timeline events
  const { data: events = [] } = useQuery<ContractEvent[]>({
    queryKey: ["contract-events", id],
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEMO_EVENTS;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("entity_type", "contract")
        .eq("entity_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({ ...e, actor_name: null }));
    },
    enabled: !!id,
  });

  // --- Actions ---
  const getNextStatus = () => {
    if (!contract) return null;
    const idx = STATUS_PIPELINE.findIndex((s) => s.key === contract.status);
    if (idx < 0 || idx >= STATUS_PIPELINE.length - 1) return null;
    return STATUS_PIPELINE[idx + 1];
  };

  const advanceStatus = async () => {
    const next = getNextStatus();
    if (!contract || !next) return;
    setSaving(true);

    if (!isSupabaseConfigured) {
      toast({ title: `Status → ${next.label} (demo)` });
      setSaving(false);
      return;
    }

    try {
      const updates: Record<string, any> = { status: next.key };
      if (next.key === "signed") updates.signed_at = new Date().toISOString();

      const { error } = await supabase.from("contracts").update(updates).eq("id", id!);
      if (error) throw error;

      await supabase.from("events").insert({
        module: "enforge", entity_type: "contract", entity_id: id,
        event_type: "contract.status_changed",
        payload: { from: contract.status, to: next.key },
        actor_id: employee?.id || null,
      });

      // If signed → update linked deal to 'won'
      if (next.key === "signed" && contract.deal_id) {
        await supabase.from("deals").update({ stage: "won" }).eq("id", contract.deal_id);
        await supabase.from("events").insert({
          module: "enflow", entity_type: "deal", entity_id: contract.deal_id,
          event_type: "deal.stage_changed",
          payload: { to: "won", reason: "Contract signed" },
          actor_id: employee?.id || null,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["contract-events", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: `Status updated to "${next.label}"` });
    } catch (err: any) {
      toast({ title: "Failed to advance status", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDeliverable = async (index: number, checked: boolean) => {
    if (!contract?.deliverables) return;
    const updated = contract.deliverables.map((d, i) =>
      i === index ? { ...d, completed: checked } : d
    );

    // Optimistic update
    queryClient.setQueryData(["contract", id], (old: any) =>
      old ? { ...old, deliverables: updated } : old
    );

    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .update({ deliverables: updated as any })
        .eq("id", id!);
      if (error) throw error;
    } catch (err: any) {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      toast({ title: "Failed to update deliverable", description: err.message, variant: "destructive" });
    }
  };

  const duplicateContract = async () => {
    if (!contract) return;
    setSaving(true);

    if (!isSupabaseConfigured) {
      toast({ title: "Contract duplicated (demo)" });
      navigate("/contracts/demo-dup");
      setSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase.from("contracts").insert({
        title: `${contract.title} (Copy)`,
        type: contract.type ?? "Other",
        status: "draft",
        deal_id: contract.deal_id,
        account_id: contract.account_id,
        owner_id: employee?.id || contract.owner_id,
        value: contract.value,
        currency: contract.currency || "SGD",
        payment_terms: contract.payment_terms,
        start_date: contract.start_date,
        end_date: contract.end_date,
        auto_renew: contract.auto_renew,
        renewal_date: contract.renewal_date,
        scope_summary: contract.scope_summary,
        deliverables: contract.deliverables as any,
        enfactum_signer_id: contract.enfactum_signer_id,
        client_signer_name: contract.client_signer_name,
        client_signer_email: contract.client_signer_email,
        internal_notes: contract.internal_notes,
      } as any).select("id").single();
      if (error) throw error;

      await supabase.from("events").insert({
        module: "enforge", entity_type: "contract", entity_id: data.id,
        event_type: "contract.duplicated",
        payload: { source_id: id },
        actor_id: employee?.id || null,
      });

      toast({ title: "Contract duplicated" });
      navigate(`/contracts/${data.id}`);
    } catch (err: any) {
      toast({ title: "Failed to duplicate", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteContract = async () => {
    setSaving(true);
    if (!isSupabaseConfigured) {
      toast({ title: "Contract deleted (demo)" });
      navigate("/contracts");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from("contracts").update({ status: "deleted" }).eq("id", id!);
      if (error) throw error;

      await supabase.from("events").insert({
        module: "enforge", entity_type: "contract", entity_id: id,
        event_type: "contract.deleted",
        payload: {},
        actor_id: employee?.id || null,
      });

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract deleted" });
      navigate("/contracts");
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    if (!isSupabaseConfigured) {
      toast({ title: "Notes saved (demo)" });
      setSaving(false);
      return;
    }
    try {
      const { error } = await supabase.from("contracts").update({ internal_notes: notes.trim() || null }).eq("id", id!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      toast({ title: "Notes saved" });
    } catch (err: any) {
      toast({ title: "Failed to save notes", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File, field: "file_url" | "signed_file_url") => {
    if (!isSupabaseConfigured) {
      toast({ title: "File upload works with Supabase connected" });
      return;
    }
    setSaving(true);
    try {
      const path = `${id}/${field === "signed_file_url" ? "signed" : "unsigned"}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("contract-documents")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      // Bucket is private — store the storage path; signed URLs are minted on demand.
      const { error } = await supabase.from("contracts").update({ [field]: path }).eq("id", id!);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      toast({ title: "File uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openContractFile = async (path: string | null) => {
    if (!path || !isSupabaseConfigured) return;
    const { data, error } = await supabase.storage
      .from("contract-documents")
      .createSignedUrl(path, 60 * 60);
    if (error || !data) {
      toast({
        title: "Failed to load file",
        description: error?.message ?? "Could not generate download link.",
        variant: "destructive",
      });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  // --- Render ---
  if (isLoading) {
    return (
      <>
        <TopBar title="Contract" />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </>
    );
  }

  if (!contract) {
    return (
      <>
        <TopBar title="Contract" />
        <main className="flex-1 p-6"><p className="text-muted-foreground">Contract not found.</p></main>
      </>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <>
      <TopBar title={contract.title} />
      <main className="flex-1 p-6 space-y-6 max-w-5xl overflow-y-auto">
        {/* Back + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/contracts")} className="gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/new?from=${id}`)} className="gap-1">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            {nextStatus && (
              <Button size="sm" onClick={advanceStatus} disabled={saving} className="gap-1">
                <ChevronRight className="h-3.5 w-3.5" /> Advance to {nextStatus.label}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={duplicateContract} disabled={saving} className="gap-1">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={saving}
              onClick={async () => {
                if (!contract) return;
                setSaving(true);
                try {
                  const { error } = await supabase.from("contracts").insert({
                    title: contract.title,
                    type: contract.type ?? "Other",
                    status: "template",
                    payment_terms: contract.payment_terms,
                    auto_renew: contract.auto_renew,
                    scope_summary: contract.scope_summary,
                    deliverables: (contract.deliverables ?? []).map(d => ({
                      title: d.title,
                      description: d.description ?? "",
                    })) as any,
                    owner_id: employee?.id ?? null,
                    metadata: { is_template: true, source_contract_id: id },
                  } as any);
                  if (error) throw error;
                  queryClient.invalidateQueries({ queryKey: ["db-templates"] });
                  toast({ title: "Saved as template", description: "You can find it on the Templates page." });
                } catch (err: any) {
                  toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
                } finally {
                  setSaving(false);
                }
              }}
            >
              <BookmarkPlus className="h-3.5 w-3.5" /> Save as Template
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this contract?</AlertDialogTitle>
                  <AlertDialogDescription>This will soft-delete the contract. It can be recovered later.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteContract}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{contract.title}</h2>
            <StatusBadge status={contract.type} />
            <StatusBadge status={contract.status} />
          </div>
          {contract.value != null && (
            <p className="text-3xl font-bold text-primary tabular-nums">
              {fmtCurrency(contract.value, contract.currency)}
            </p>
          )}
        </div>

        {/* Status Pipeline */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <StatusPipeline currentStatus={contract.status} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="signatories">Signatories</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* == Overview == */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Contract Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Account" value={contract.account_name || "—"} />
                  <Row label="Deal" value={contract.deal_title || "—"} />
                  <Row label="Value" value={fmtCurrency(contract.value, contract.currency)} />
                  <Row label="Payment Terms" value={contract.payment_terms || "—"} />
                  <Row label="Start Date" value={fmtDate(contract.start_date)} />
                  <Row label="End Date" value={fmtDate(contract.end_date)} />
                  <Row label="Auto-Renew" value={contract.auto_renew ? "Yes" : "No"} />
                  {contract.auto_renew && <Row label="Renewal Date" value={fmtDate(contract.renewal_date)} />}
                  <Row label="Owner" value={contract.owner_name || "—"} />
                </CardContent>
              </Card>

              {contract.scope_summary && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Scope Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.scope_summary}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Deliverables checklist */}
            {contract.deliverables && contract.deliverables.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Key Deliverables</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contract.deliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Checkbox
                          checked={d.completed ?? false}
                          className="mt-0.5"
                          onCheckedChange={(checked) => handleToggleDeliverable(i, !!checked)}
                        />
                        <div>
                          <p className={cn("text-sm font-medium", d.completed && "line-through text-muted-foreground")}>
                            {d.title}
                          </p>
                          {d.description && (
                            <p className="text-xs text-muted-foreground">{d.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* == Timeline == */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-6">
                    {/* vertical line */}
                    <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
                    {events.map((ev) => (
                      <div key={ev.id} className="relative">
                        <div className="absolute -left-6 top-1 w-[22px] h-[22px] rounded-full border-2 border-primary bg-background flex items-center justify-center">
                          <Clock className="h-3 w-3 text-primary" />
                        </div>
                        <div className="pl-3">
                          <p className="text-sm font-medium text-foreground">{humanEvent(ev.event_type)}</p>
                          {ev.payload && Object.keys(ev.payload).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ev.payload.from && ev.payload.to
                                ? `${ev.payload.from} → ${ev.payload.to}`
                                : JSON.stringify(ev.payload)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {ev.actor_name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> {ev.actor_name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {fmtDateTime(ev.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* == Signatories == */}
          <TabsContent value="signatories" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">Enfactum Signer</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Signer ID" value={contract.enfactum_signer_id || "—"} />
                  {contract.signed_at && <Row label="Signed Date" value={fmtDate(contract.signed_at)} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Client Signer</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Name" value={contract.client_signer_name || "—"} />
                  <Row label="Email" value={contract.client_signer_email || "—"} />
                  {contract.signed_at && <Row label="Signed Date" value={fmtDate(contract.signed_at)} />}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm">Contract Documents</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Unsigned PDF */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Unsigned Contract PDF</p>
                      {contract.file_url ? (
                        <button
                          type="button"
                          onClick={() => openContractFile(contract.file_url)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          View file <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground">No file uploaded</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "file_url")} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving} className="gap-1">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                  </div>
                </div>

                {/* Signed PDF */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Signed Contract PDF</p>
                      {contract.signed_file_url ? (
                        <button
                          type="button"
                          onClick={() => openContractFile(contract.signed_file_url)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          View file <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground">No file uploaded</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <input ref={signedFileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "signed_file_url")} />
                    <Button variant="outline" size="sm" onClick={() => signedFileInputRef.current?.click()} disabled={saving} className="gap-1">
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* == Notes == */}
          <TabsContent value="notes">
            <Card>
              <CardHeader><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="Internal notes (not visible to client)…"
                />
                <Button onClick={saveNotes} disabled={saving} size="sm" className="gap-1">
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

export default ContractDetail;
