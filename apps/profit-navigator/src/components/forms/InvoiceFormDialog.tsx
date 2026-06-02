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
import type { Invoice } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["Draft", "Issued", "Paid", "Overdue", "Cancelled"];

const invoiceSchema = z.object({
  invoice_no: z.string().trim().min(1, "Invoice number is required").max(50, "Max 50 characters"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  amount_ex_tax: z.coerce.number().min(0, "Must be ≥ 0"),
  tax_amount: z.coerce.number().min(0, "Must be ≥ 0"),
  status: z.string().min(1, "Select a status"),
  paid_date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  invoice?: Invoice | null;
  onSave: (data: Omit<Invoice, "invoice_id">) => void;
}

export default function InvoiceFormDialog({ open, onOpenChange, projectId, invoice, onSave }: Props) {
  const { toast } = useToast();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_no: "",
      invoice_date: new Date().toISOString().split("T")[0],
      amount_ex_tax: 0,
      tax_amount: 0,
      status: "Draft",
      paid_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      form.reset({
        invoice_no: invoice.invoice_no,
        invoice_date: invoice.invoice_date,
        amount_ex_tax: invoice.amount_ex_tax,
        tax_amount: invoice.tax_amount,
        status: invoice.status,
        paid_date: invoice.paid_date ?? "",
        notes: invoice.notes ?? "",
      });
    } else {
      form.reset({
        invoice_no: "",
        invoice_date: new Date().toISOString().split("T")[0],
        amount_ex_tax: 0, tax_amount: 0, status: "Draft", paid_date: "", notes: "",
      });
    }
  }, [invoice, open, form]);

  const watchAmountExTax = form.watch("amount_ex_tax");
  const watchTaxAmount = form.watch("tax_amount");
  const totalAmount = (watchAmountExTax || 0) + (watchTaxAmount || 0);

  function handleSubmit(values: InvoiceFormValues) {
    onSave({
      project_id: projectId,
      invoice_no: values.invoice_no.trim(),
      invoice_date: values.invoice_date,
      amount_ex_tax: values.amount_ex_tax,
      tax_amount: values.tax_amount,
      total_amount: values.amount_ex_tax + values.tax_amount,
      status: values.status,
      paid_date: values.paid_date || undefined,
      notes: values.notes?.trim() || undefined,
    });
    toast({ title: invoice ? "Invoice updated" : "Invoice added" });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Add Invoice"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoice_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice # *</FormLabel>
                  <FormControl><Input {...field} maxLength={50} placeholder="INV-001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="invoice_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount_ex_tax" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Ex Tax) *</FormLabel>
                  <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tax_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Amount</FormLabel>
                  <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded tabular-nums mono">
              Total Amount: {totalAmount.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paid_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} maxLength={500} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{invoice ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
