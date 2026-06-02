import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import type { InternalResource } from "@/data/types";

const resourceSchema = z.object({
  resource_name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  role: z.string().trim().min(1, "Role is required").max(100, "Max 100 characters"),
  cost_rate_per_hour: z.coerce.number().min(0, "Must be ≥ 0"),
  recharge_rate_per_hour: z.coerce.number().min(0, "Must be ≥ 0"),
  active_flag: z.boolean(),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: InternalResource | null;
  onSave: (data: Omit<InternalResource, "resource_id">) => void;
}

export default function ResourceFormDialog({ open, onOpenChange, resource, onSave }: Props) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { resource_name: "", role: "", cost_rate_per_hour: 0, recharge_rate_per_hour: 0, active_flag: true },
  });

  useEffect(() => {
    if (!open) return;
    if (resource) {
      form.reset({
        resource_name: resource.resource_name,
        role: resource.role,
        cost_rate_per_hour: resource.cost_rate_per_hour,
        recharge_rate_per_hour: resource.recharge_rate_per_hour,
        active_flag: resource.active_flag,
      });
    } else {
      form.reset({ resource_name: "", role: "", cost_rate_per_hour: 0, recharge_rate_per_hour: 0, active_flag: true });
    }
  }, [open, resource, form]);

  function handleSubmit(values: ResourceFormValues) {
    onSave({
      resource_name: values.resource_name,
      role: values.role,
      cost_rate_per_hour: values.cost_rate_per_hour,
      recharge_rate_per_hour: values.recharge_rate_per_hour,
      active_flag: values.active_flag,
    });
    toast.success(resource ? "Resource updated" : "Resource added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "New Resource"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="resource_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} maxLength={100} placeholder="Resource name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <FormControl><Input {...field} maxLength={100} placeholder="e.g. Designer" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cost_rate_per_hour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Rate/hr *</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} placeholder="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recharge_rate_per_hour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recharge Rate/hr *</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} placeholder="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="active_flag" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{resource ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
