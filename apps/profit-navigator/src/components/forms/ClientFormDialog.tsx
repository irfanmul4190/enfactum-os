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
import { COUNTRIES, INDUSTRIES, CURRENCIES, PAYMENT_TERMS } from "@/data/seedData";
import type { Client } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

const TAX_TREATMENTS = ["Tax Exclusive", "Tax Inclusive", "No Tax"] as const;

const clientSchema = z.object({
  client_name: z.string().trim().min(1, "Client name is required").max(100, "Max 100 characters"),
  client_legal_name: z.string().max(100).optional(),
  country: z.string().min(1),
  industry: z.string().min(1),
  billing_currency: z.string().min(1),
  payment_terms: z.string().min(1),
  tax_treatment: z.enum(TAX_TREATMENTS),
  billing_contact_name: z.string().max(100).optional(),
  billing_contact_email: z.string().max(255).email("Invalid email").optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (data: Omit<Client, "client_id">) => void | Promise<void>;
}

export default function ClientFormDialog({ open, onOpenChange, client, onSave }: Props) {
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_name: "", client_legal_name: "", country: "Singapore", industry: "Technology",
      billing_currency: "SGD", payment_terms: "Net 30", tax_treatment: "Tax Exclusive",
      billing_contact_name: "", billing_contact_email: "", notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (client) {
      form.reset({
        client_name: client.client_name,
        client_legal_name: client.client_legal_name ?? "",
        country: client.country,
        industry: client.industry,
        billing_currency: client.billing_currency,
        payment_terms: client.payment_terms,
        tax_treatment: client.tax_treatment as ClientFormValues["tax_treatment"],
        billing_contact_name: client.billing_contact_name ?? "",
        billing_contact_email: client.billing_contact_email ?? "",
        notes: client.notes ?? "",
      });
    } else {
      form.reset({
        client_name: "", client_legal_name: "", country: "Singapore", industry: "Technology",
        billing_currency: "SGD", payment_terms: "Net 30", tax_treatment: "Tax Exclusive",
        billing_contact_name: "", billing_contact_email: "", notes: "",
      });
    }
  }, [client, open, form]);

  async function handleSubmit(values: ClientFormValues) {
    try {
      await onSave({
        client_name: values.client_name.trim(),
        client_legal_name: values.client_legal_name?.trim() || undefined,
        country: values.country,
        industry: values.industry,
        billing_currency: values.billing_currency,
        payment_terms: values.payment_terms,
        tax_treatment: values.tax_treatment,
        billing_contact_name: values.billing_contact_name?.trim() || undefined,
        billing_contact_email: values.billing_contact_email?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });
      toast({ title: client ? "Client updated" : "Client created" });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Could not save client",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="client_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name *</FormLabel>
                <FormControl><Input {...field} maxLength={100} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="client_legal_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name</FormLabel>
                <FormControl><Input {...field} maxLength={100} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="billing_currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="payment_terms" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{PAYMENT_TERMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tax_treatment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Treatment</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{TAX_TREATMENTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="billing_contact_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Contact</FormLabel>
                  <FormControl><Input {...field} maxLength={100} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="billing_contact_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Email</FormLabel>
                  <FormControl><Input type="email" {...field} maxLength={255} /></FormControl>
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
              <Button type="submit">{client ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
