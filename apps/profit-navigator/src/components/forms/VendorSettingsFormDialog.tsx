import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import type { Vendor } from "@/data/types";
import { CURRENCIES } from "@/data/seedData";

const vendorSchema = z.object({
  vendor_name: z.string().trim().min(1, "Vendor name is required").max(100, "Max 100 characters"),
  category_default: z.string().max(100).optional(),
  currency_default: z.string().min(1),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSave: (data: Omit<Vendor, "vendor_id">) => void;
}

export default function VendorSettingsFormDialog({ open, onOpenChange, vendor, onSave }: Props) {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { vendor_name: "", category_default: "", currency_default: "SGD" },
  });

  useEffect(() => {
    if (!open) return;
    if (vendor) {
      form.reset({
        vendor_name: vendor.vendor_name,
        category_default: vendor.category_default ?? "",
        currency_default: vendor.currency_default ?? "SGD",
      });
    } else {
      form.reset({ vendor_name: "", category_default: "", currency_default: "SGD" });
    }
  }, [open, vendor, form]);

  function handleSubmit(values: VendorFormValues) {
    onSave({
      vendor_name: values.vendor_name.trim(),
      category_default: values.category_default?.trim() || undefined,
      currency_default: values.currency_default,
    });
    toast.success(vendor ? "Vendor updated" : "Vendor added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit Vendor" : "New Vendor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="vendor_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name *</FormLabel>
                <FormControl><Input {...field} maxLength={100} placeholder="Company name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category_default" render={({ field }) => (
              <FormItem>
                <FormLabel>Default Category</FormLabel>
                <FormControl><Input {...field} maxLength={100} placeholder="e.g. Creative Production" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="currency_default" render={({ field }) => (
              <FormItem>
                <FormLabel>Default Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{vendor ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
