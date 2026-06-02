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
import { resources } from "@/data/seedData";
import type { Timesheet } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

const ACTIVITIES = ["Strategy", "Creative", "Content", "Media", "Events", "Marketing Ops", "Program Mgmt", "Design", "Dev", "Other"];
const STATUSES = ["Draft", "Submitted", "Approved", "Rejected"];

const timesheetSchema = z.object({
  resource_id: z.string().min(1, "Select a resource"),
  work_date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().min(0.5, "Minimum 0.5 hours").max(24, "Maximum 24 hours")
    .refine(v => v % 0.5 === 0, "Must be in 0.5 increments"),
  activity_type: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().max(300).optional(),
});

type TimesheetFormValues = z.infer<typeof timesheetSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  timesheet?: Timesheet | null;
  onSave: (data: Omit<Timesheet, "timesheet_id">) => void;
}

export default function TimesheetFormDialog({ open, onOpenChange, projectId, timesheet, onSave }: Props) {
  const { toast } = useToast();

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      resource_id: resources[0]?.resource_id ?? "",
      work_date: new Date().toISOString().split("T")[0],
      hours: 8,
      activity_type: "Program Mgmt",
      status: "Draft",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (timesheet) {
      form.reset({
        resource_id: timesheet.resource_id,
        work_date: timesheet.work_date,
        hours: timesheet.hours,
        activity_type: timesheet.activity_type,
        status: timesheet.status,
        notes: timesheet.notes ?? "",
      });
    } else {
      form.reset({
        resource_id: resources[0]?.resource_id ?? "",
        work_date: new Date().toISOString().split("T")[0],
        hours: 8, activity_type: "Program Mgmt", status: "Draft", notes: "",
      });
    }
  }, [timesheet, open, form]);

  function handleSubmit(values: TimesheetFormValues) {
    const res = resources.find(r => r.resource_id === values.resource_id)!;
    const costRate = res.cost_rate_per_hour;
    const rechargeRate = res.recharge_rate_per_hour;
    onSave({
      project_id: projectId,
      resource_id: values.resource_id,
      work_date: values.work_date,
      hours: values.hours,
      activity_type: values.activity_type,
      cost_rate: costRate,
      cost_amount: values.hours * costRate,
      recharge_rate: rechargeRate,
      recharge_amount: values.hours * rechargeRate,
      status: values.status,
      notes: values.notes?.trim() || undefined,
    });
    toast({ title: timesheet ? "Timesheet updated" : "Timesheet added" });
    onOpenChange(false);
  }

  const selectedRes = resources.find(r => r.resource_id === form.watch("resource_id"));
  const watchHours = form.watch("hours");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{timesheet ? "Edit Timesheet" : "Add Timesheet Entry"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="resource_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Resource *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{resources.filter(r => r.active_flag).map(r => (
                    <SelectItem key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.role})</SelectItem>
                  ))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="work_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours * (0.5 increments)</FormLabel>
                  <FormControl><Input type="number" min={0.5} max={24} step={0.5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="activity_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{ACTIVITIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {selectedRes && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Cost: SG$ {selectedRes.cost_rate_per_hour}/hr → SG$ {(watchHours * selectedRes.cost_rate_per_hour).toLocaleString()} &nbsp;|&nbsp;
                Recharge: SG$ {selectedRes.recharge_rate_per_hour}/hr → SG$ {(watchHours * selectedRes.recharge_rate_per_hour).toLocaleString()}
              </div>
            )}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} maxLength={300} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{timesheet ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
