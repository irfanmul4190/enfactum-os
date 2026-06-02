import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { COUNTRIES, CURRENCIES, PROJECT_STATUSES, INVOICE_MODELS, BUSINESS_TYPES } from "@/data/seedData";
import { useDataStore } from "@/hooks/useDataStore";
import type { Project } from "@/data/types";
import { stakeholders } from "@/data/seedData";
import { useToast } from "@/hooks/use-toast";

const REV_REC = ["Invoices (Actual)", "Contract Value (Baseline until invoiced)"];
const FLAT_FEES = [10, 12, 15];

const projectSchema = z.object({
  client_id: z.string().min(1, "Select a client"),
  project_name: z.string().trim().min(1, "Project name is required").max(150, "Max 150 characters"),
  description: z.string().max(500).optional(),
  country_of_delivery: z.string().min(1),
  currency: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: z.string().min(1),
  commercial_model: z.enum(["ENFACTUM_LED", "PARTNER_PASS_THROUGH"]),
  invoice_model: z.string().min(1),
  business_type: z.string().optional(),
  revenue_recognition_basis: z.string().min(1),
  contracted_revenue_ex_tax: z.coerce.number().min(0, "Must be ≥ 0"),
  margin_target_percent: z.coerce.number().min(0).max(100),
  approvals_status: z.string().optional(),
  sales_person: z.string().optional(),
  external_partner_stakeholder_id: z.string().optional(),
  partner_revenue_basis_ex_tax: z.coerce.number().min(0).optional(),
  flat_fee_percent: z.coerce.number().optional(),
  pass_through_payout_basis: z.enum(["ENFACTUM_NET_REVENUE", "ENFACTUM_CONTRIBUTION_MARGIN"]).optional(),
  internal_recharge_applies: z.boolean().optional(),
}).refine(data => {
  if (data.commercial_model === "PARTNER_PASS_THROUGH" && (!data.partner_revenue_basis_ex_tax || data.partner_revenue_basis_ex_tax <= 0)) {
    return false;
  }
  return true;
}, { message: "Partner revenue must be > 0 for pass-through projects", path: ["partner_revenue_basis_ex_tax"] });

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSave: (data: Omit<Project, "project_id" | "project_code">) => void | Promise<void>;
}

export default function ProjectFormDialog({ open, onOpenChange, project, onSave }: Props) {
  const { toast } = useToast();
  const { clients } = useDataStore();
  const externalPartners = stakeholders.filter(s => s.stakeholder_type === "EXTERNAL_PARTNER");

  const defaults: ProjectFormValues = {
    client_id: clients[0]?.client_id ?? "",
    project_name: "",
    description: "",
    country_of_delivery: "Singapore",
    currency: "SGD",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    status: "Draft",
    commercial_model: "ENFACTUM_LED",
    invoice_model: "Fixed Fee",
    revenue_recognition_basis: "Invoices (Actual)",
    contracted_revenue_ex_tax: 0,
    margin_target_percent: 40,
    approvals_status: "Draft",
    external_partner_stakeholder_id: externalPartners[0]?.stakeholder_id ?? "",
    partner_revenue_basis_ex_tax: 0,
    flat_fee_percent: 10,
    pass_through_payout_basis: "ENFACTUM_NET_REVENUE",
    internal_recharge_applies: true,
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    if (project) {
      form.reset({ ...defaults, ...project } as ProjectFormValues);
    } else {
      form.reset(defaults);
    }
  }, [project, open, form]);

  const isPassThrough = form.watch("commercial_model") === "PARTNER_PASS_THROUGH";

  async function handleSubmit(values: ProjectFormValues) {
    const data: any = { ...values };
    if (data.commercial_model === "ENFACTUM_LED") {
      delete data.external_partner_stakeholder_id;
      delete data.partner_revenue_basis_ex_tax;
      delete data.flat_fee_percent;
      delete data.pass_through_payout_basis;
      delete data.internal_recharge_applies;
    }
    try {
      await onSave(data);
      toast({ title: project ? "Project updated" : "Project created" });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Could not save project",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="project_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name *</FormLabel>
                <FormControl><Input {...field} maxLength={150} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="client_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{clients.map(c => <SelectItem key={c.client_id} value={c.client_id}>{c.client_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="country_of_delivery" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoice_model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Model</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{INVOICE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="business_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select value={field.value ?? "Consulting"} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="commercial_model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Commercial Model</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="ENFACTUM_LED">Enfactum-Led</SelectItem>
                      <SelectItem value="PARTNER_PASS_THROUGH">Partner Pass-Through</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="revenue_recognition_basis" render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Recognition</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{REV_REC.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {!isPassThrough && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contracted_revenue_ex_tax" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contracted Revenue (Ex Tax)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="margin_target_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margin Target %</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {isPassThrough && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                <p className="text-sm font-medium">Pass-Through Configuration</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="external_partner_stakeholder_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Partner</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{externalPartners.map(s => <SelectItem key={s.stakeholder_id} value={s.stakeholder_id}>{s.stakeholder_name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="partner_revenue_basis_ex_tax" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Revenue (Ex Tax) *</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="flat_fee_percent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Fee %</FormLabel>
                      <Select value={String(field.value ?? 10)} onValueChange={v => field.onChange(Number(v))}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{FLAT_FEES.map(f => <SelectItem key={f} value={String(f)}>{f}%</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pass_through_payout_basis" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Basis</FormLabel>
                      <Select value={field.value ?? "ENFACTUM_NET_REVENUE"} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ENFACTUM_NET_REVENUE">Enfactum Net Revenue</SelectItem>
                          <SelectItem value="ENFACTUM_CONTRIBUTION_MARGIN">Contribution Margin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="internal_recharge_applies" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Internal Recharge Applies</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="margin_target_percent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margin Target %</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} maxLength={500} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{project ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
