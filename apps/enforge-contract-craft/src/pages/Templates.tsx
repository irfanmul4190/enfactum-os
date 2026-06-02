import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Plus, ArrowRight, Trash2, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getCustomTemplates, deleteCustomTemplate, type CustomTemplate } from "@/lib/customTemplates";

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  category: "services" | "legal" | "procurement" | "custom" | "saved";
  defaults: {
    title?: string;
    type: string;
    paymentTerms?: string;
    autoRenew?: boolean;
    scopeSummary?: string;
    deliverables?: { title: string; description: string }[];
  };
}

const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "msa-standard",
    name: "Standard MSA",
    type: "MSA",
    description: "Master Services Agreement for long-term client engagements. Covers general terms, IP ownership, liability, and SLA frameworks.",
    category: "services",
    defaults: {
      title: "Master Services Agreement — ",
      type: "MSA",
      paymentTerms: "Net 30",
      autoRenew: true,
      scopeSummary: "Master Services Agreement covering technology consulting, development, and support services.",
      deliverables: [
        { title: "Service Level Agreement", description: "Define uptime, response time, and escalation procedures" },
        { title: "Governance Framework", description: "Monthly review cadence and reporting structure" },
      ],
    },
  },
  {
    id: "sow-development",
    name: "Software Development SOW",
    type: "SOW",
    description: "Statement of Work for custom software development projects. Includes phases, milestones, and acceptance criteria.",
    category: "services",
    defaults: {
      title: "SOW — ",
      type: "SOW",
      paymentTerms: "Milestone-based",
      autoRenew: false,
      scopeSummary: "Custom software development engagement including requirements analysis, design, development, testing, and deployment.",
      deliverables: [
        { title: "Requirements Document", description: "Detailed functional and technical requirements" },
        { title: "Architecture Design", description: "System architecture and technology stack documentation" },
        { title: "Development & Testing", description: "Iterative development with unit and integration testing" },
        { title: "Deployment & Handover", description: "Production deployment, documentation, and knowledge transfer" },
      ],
    },
  },
  {
    id: "sow-consulting",
    name: "Consulting Engagement SOW",
    type: "SOW",
    description: "Statement of Work for advisory and consulting projects. Time & materials or fixed-fee structure.",
    category: "services",
    defaults: {
      title: "SOW — Consulting: ",
      type: "SOW",
      paymentTerms: "Monthly retainer",
      autoRenew: false,
      scopeSummary: "Technology consulting engagement covering strategy, assessment, and recommendation delivery.",
      deliverables: [
        { title: "Current State Assessment", description: "Review of existing systems, processes, and capabilities" },
        { title: "Strategy & Roadmap", description: "Recommended approach with prioritized initiatives" },
        { title: "Final Report", description: "Executive summary and detailed recommendations" },
      ],
    },
  },
  {
    id: "nda-mutual",
    name: "Mutual NDA",
    type: "NDA",
    description: "Mutual Non-Disclosure Agreement for protecting confidential information exchanged between parties.",
    category: "legal",
    defaults: {
      title: "NDA — ",
      type: "NDA",
      autoRenew: false,
      scopeSummary: "Mutual non-disclosure agreement to protect confidential and proprietary information shared between parties during business discussions and collaboration.",
      deliverables: [],
    },
  },
  {
    id: "nda-unilateral",
    name: "Unilateral NDA",
    type: "NDA",
    description: "One-way NDA where only one party discloses confidential information to the other.",
    category: "legal",
    defaults: {
      title: "NDA (Unilateral) — ",
      type: "NDA",
      autoRenew: false,
      scopeSummary: "Unilateral non-disclosure agreement protecting confidential information disclosed by the disclosing party.",
      deliverables: [],
    },
  },
  {
    id: "po-standard",
    name: "Standard Purchase Order",
    type: "PO",
    description: "Purchase Order for procurement of goods or services with defined quantities, pricing, and delivery terms.",
    category: "procurement",
    defaults: {
      title: "PO — ",
      type: "PO",
      paymentTerms: "Net 45",
      autoRenew: false,
      scopeSummary: "Purchase order for specified goods/services as per agreed terms and pricing.",
      deliverables: [
        { title: "Delivery", description: "Goods/services delivered per agreed specifications and timeline" },
      ],
    },
  },
  {
    id: "amendment",
    name: "Contract Amendment",
    type: "Amendment",
    description: "Amendment to modify terms of an existing contract — scope changes, extensions, or pricing updates.",
    category: "legal",
    defaults: {
      title: "Amendment — ",
      type: "Amendment",
      autoRenew: false,
      scopeSummary: "Amendment to the original agreement modifying the following terms: [specify scope, timeline, or pricing changes].",
      deliverables: [],
    },
  },
  {
    id: "sow-data",
    name: "Data Platform SOW",
    type: "SOW",
    description: "Statement of Work for data engineering, analytics platform builds, or data migration projects.",
    category: "services",
    defaults: {
      title: "SOW — Data Platform: ",
      type: "SOW",
      paymentTerms: "Milestone-based",
      autoRenew: false,
      scopeSummary: "Data platform engagement covering data architecture, ETL pipeline development, analytics dashboards, and data governance setup.",
      deliverables: [
        { title: "Data Architecture Design", description: "Data models, storage strategy, and integration patterns" },
        { title: "ETL Pipeline Development", description: "Automated data ingestion and transformation pipelines" },
        { title: "Analytics & Dashboards", description: "Business intelligence dashboards and reporting" },
        { title: "Data Governance", description: "Access controls, quality checks, and compliance documentation" },
      ],
    },
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  saved: "Saved Templates",
  custom: "My Templates",
  services: "Services",
  legal: "Legal",
  procurement: "Procurement",
};

const TYPE_COLORS: Record<string, string> = {
  MSA: "bg-primary/15 text-primary border-primary/30",
  SOW: "bg-success/15 text-success border-success/30",
  NDA: "bg-warning/15 text-warning border-warning/30",
  PO: "bg-muted text-muted-foreground border-muted",
  Amendment: "bg-destructive/15 text-destructive border-destructive/30",
  Other: "bg-muted text-muted-foreground border-muted",
};

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(getCustomTemplates);

  const refreshCustom = useCallback(() => setCustomTemplates(getCustomTemplates()), []);

  // Fetch DB-saved templates (contracts with metadata->>'is_template' = 'true')
  const { data: dbTemplates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["db-templates"],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, type, scope_summary, payment_terms, auto_renew, deliverables, metadata")
        .eq("metadata->>is_template", "true")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch DB templates:", error);
        return [];
      }
      return (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.title,
        type: c.type ?? "Other",
        description: (c.scope_summary ?? "").slice(0, 120) || `Saved ${c.type} template`,
        category: "saved" as const,
        defaults: {
          title: c.title.replace(/—.*$/, "— ").trim() + " ",
          type: c.type ?? "Other",
          paymentTerms: c.payment_terms ?? undefined,
          autoRenew: c.auto_renew ?? false,
          scopeSummary: c.scope_summary ?? undefined,
          deliverables: Array.isArray(c.deliverables)
            ? c.deliverables.map((d: any) => ({ title: d.title ?? "", description: d.description ?? "" }))
            : undefined,
        },
      }));
    },
    staleTime: 30000,
  });

  const handleDelete = (id: string) => {
    deleteCustomTemplate(id);
    refreshCustom();
    toast({ title: "Template deleted" });
  };

  const useTemplate = (template: Template | CustomTemplate) => {
    const params = new URLSearchParams();
    const d = template.defaults;
    if (d.title) params.set("title", d.title);
    if (d.type) params.set("type", d.type);
    if (d.paymentTerms) params.set("paymentTerms", d.paymentTerms);
    if (d.autoRenew !== undefined) params.set("autoRenew", String(d.autoRenew));
    if (d.scopeSummary) params.set("scopeSummary", d.scopeSummary);
    if (d.deliverables && d.deliverables.length > 0) {
      params.set("deliverables", JSON.stringify(d.deliverables));
    }
    navigate(`/contracts/new?${params.toString()}`);
  };

  const allCategories = ["saved", "custom", "services", "legal", "procurement"] as const;

  const customAsTemplates: Template[] = customTemplates.map(ct => ({
    ...ct,
    category: "custom" as const,
  }));

  const allTemplates = [...dbTemplates, ...customAsTemplates, ...BUILT_IN_TEMPLATES];

  return (
    <>
      <TopBar title="Templates" />
      <main className="flex-1 p-6 space-y-8 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Contract Templates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start with a pre-configured template to speed up contract creation.
            </p>
          </div>
          <Button onClick={() => navigate("/contracts/new")} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Blank Contract
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-4" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          allCategories.map(cat => {
            const items = allTemplates.filter(t => t.category === cat);
            if (items.length === 0) return null;
            const isCustom = cat === "custom";
            const isSaved = cat === "saved";
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  {isSaved && <Database className="h-3.5 w-3.5" />}
                  {CATEGORY_LABELS[cat]}
                  <span className="text-xs font-normal">({items.length})</span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(template => (
                    <Card
                      key={template.id}
                      className="group cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 relative"
                      onClick={() => useTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-sm truncate">{template.name}</CardTitle>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0", TYPE_COLORS[template.type] ?? TYPE_COLORS.Other)}>
                            {template.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        {template.defaults.deliverables && template.defaults.deliverables.length > 0 && (
                          <div className="text-[10px] text-muted-foreground/70 mb-3">
                            {template.defaults.deliverables.length} pre-defined deliverable{template.defaults.deliverables.length > 1 ? "s" : ""}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Use template <ArrowRight className="h-3 w-3 ml-1" />
                          </div>
                          {isCustom && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove "{template.name}" from your custom templates.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(template.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {!isLoading && allTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No templates available</p>
            <p className="text-sm text-muted-foreground">Create a contract and save it as a template to get started.</p>
          </div>
        )}
      </main>
    </>
  );
};

export default Templates;
