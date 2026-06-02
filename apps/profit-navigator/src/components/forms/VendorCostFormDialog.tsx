import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { vendors } from "@/data/seedData";
import type { VendorCost } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Media Buy", "Creative Production", "Video", "Printing", "Event Ops", "Tech Tools", "Subcontractor", "Other"];
const COST_TYPES = ["Fixed", "Variable", "Retainer", "Milestone"];
const PAY_STATUSES = ["Not Submitted", "Submitted", "Approved", "Paid"];

const vendorCostSchema = z.object({
  vendor_id: z.string().min(1, "Select a vendor"),
  cost_category: z.string().min(1),
  cost_type: z.string().min(1),
  planned_amount: z.coerce.number().min(0, "Must be ≥ 0"),
  actual_amount: z.coerce.number().min(0, "Must be ≥ 0"),
  invoice_ref: z.string().max(50).optional(),
  invoice_date: z.string().optional(),
  payment_status: z.string().min(1),
  notes: z.string().max(300).optional(),
});

type VendorCostFormValues = z.infer<typeof vendorCostSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  vendorCost?: VendorCost | null;
  onSave: (data: Omit<VendorCost, "vendor_cost_id">) => void;
}

export default function VendorCostFormDialog({ open, onOpenChange, projectId, vendorCost, onSave }: Props) {
  const { toast } = useToast();

  const form = useForm<VendorCostFormValues>({
    resolver: zodResolver(vendorCostSchema),
    defaultValues: {
      vendor_id: vendors[0]?.vendor_id ?? "",
      cost_category: "Creative Production",
      cost_type: "Fixed",
      planned_amount: 0,
      actual_amount: 0,
      invoice_ref: "",
      invoice_date: "",
      payment_status: "Not Submitted",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (vendorCost) {
      form.reset({
        vendor_id: vendorCost.vendor_id,
        cost_category: vendorCost.cost_category,
        cost_type: vendorCost.cost_type,
        planned_amount: vendorCost.planned_amount,
        actual_amount: vendorCost.actual_amount,
        invoice_ref: vendorCost.invoice_ref ?? "",
        invoice_date: vendorCost.invoice_date ?? "",
        payment_status: vendorCost.payment_status,
        notes: vendorCost.notes ?? "",
      });
    } else {
      form.reset({
        vendor_id: vendors[0]?.vendor_id ?? "", cost_category: "Creative Production",
        cost_type: "Fixed", planned_amount: 0, actual_amount: 0, invoice_ref: "",
        invoice_date: "", payment_status: "Not Submitted", notes: "",
      });
    }
  }, [vendorCost, open, form]);

  function handleSubmit(values: VendorCostFormValues) {
    onSave({
      project_id: projectId,
      vendor_id: values.vendor_id,
      cost_category: values.cost_category,
      cost_type: values.cost_type,
      planned_amount: values.planned_amount,
      actual_amount: values.actual_amount,
      invoice_ref: values.invoice_ref?.trim() || undefined,
      invoice_date: values.invoice_date || undefined,
      payment_status: values.payment_status,
      notes: values.notes?.trim() || undefined,
    });
    toast({ title: vendorCost ? "Vendor cost updated" : "Vendor cost added" });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{vendorCost ? "Edit Vendor Cost" : "Add Vendor Cost"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="vendor_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{vendors.map(v => <SelectItem key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cost_category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cost_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{COST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="planned_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Amount</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="actual_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Amount</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoice_ref" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Ref</FormLabel>
                  <FormControl><Input {...field} maxLength={50} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="invoice_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="payment_status" render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{PAY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} maxLength={300} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{vendorCost ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
