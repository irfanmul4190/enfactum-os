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
import { toast } from "sonner";
import type { Stakeholder } from "@/data/types";
import { STAKEHOLDER_TYPES } from "@/data/seedData";

const stakeholderSchema = z.object({
  stakeholder_name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  stakeholder_type: z.string().min(1),
  notes: z.string().max(500).optional(),
});

type StakeholderFormValues = z.infer<typeof stakeholderSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder?: Stakeholder | null;
  onSave: (data: Omit<Stakeholder, "stakeholder_id">) => void;
}

export default function StakeholderFormDialog({ open, onOpenChange, stakeholder, onSave }: Props) {
  const form = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: { stakeholder_name: "", stakeholder_type: "RAINMAKER", notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (stakeholder) {
      form.reset({
        stakeholder_name: stakeholder.stakeholder_name,
        stakeholder_type: stakeholder.stakeholder_type,
        notes: stakeholder.notes ?? "",
      });
    } else {
      form.reset({ stakeholder_name: "", stakeholder_type: "RAINMAKER", notes: "" });
    }
  }, [open, stakeholder, form]);

  function handleSubmit(values: StakeholderFormValues) {
    onSave({
      stakeholder_name: values.stakeholder_name.trim(),
      stakeholder_type: values.stakeholder_type,
      notes: values.notes?.trim() || undefined,
    });
    toast.success(stakeholder ? "Stakeholder updated" : "Stakeholder added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stakeholder ? "Edit Stakeholder" : "New Stakeholder"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="stakeholder_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} maxLength={100} placeholder="Full name or company" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="stakeholder_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {STAKEHOLDER_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} maxLength={500} rows={2} placeholder="Optional notes" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{stakeholder ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
