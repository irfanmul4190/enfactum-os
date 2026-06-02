import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resources } from "@/data/seedData";
import { fmtNumber, fmtMoney } from "@/lib/formatters";
import { Plus, Pencil, Trash2 } from "lucide-react";
import TimesheetFormDialog from "@/components/forms/TimesheetFormDialog";
import type { Timesheet } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  timesheets: Timesheet[];
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

export function TimesheetTab({ projectId, timesheets, onAdd, onUpdate, onDelete }: Props) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Timesheet | null>(null);
  const fmtSGD = (amount: number) => fmtMoney(amount, "SGD");

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Timesheets</h3>
          <button className="btn-glass" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" />Add</button>
        </div>
        <div className="overflow-x-auto">
          {timesheets.length === 0 ? (
            <p className="px-4 py-6 text-center text-muted-foreground">No timesheets for this project.</p>
          ) : (
            <table className="w-full data-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Resource</th>
                  <th>Activity</th>
                  <th className="text-right">Hours</th>
                  <th className="text-right">Cost Amount (SG$)</th>
                  <th className="text-right">Recharge Amount (SG$)</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map(t => {
                  const res = resources.find(r => r.resource_id === t.resource_id);
                  return (
                    <tr key={t.timesheet_id}>
                      <td className="font-medium">{res?.resource_name}</td>
                      <td className="text-muted-foreground">{t.activity_type}</td>
                      <td className="text-right tabular-nums mono">{fmtNumber(t.hours, 1)}</td>
                      <td className="text-right tabular-nums mono">{fmtSGD(t.cost_amount)}</td>
                      <td className="text-right tabular-nums mono">{fmtSGD(t.recharge_amount)}</td>
                      <td><Badge variant="secondary" className="text-xs">{t.status}</Badge></td>
                      <td className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(t); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { onDelete(t.timesheet_id); toast({ title: "Timesheet deleted" }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TimesheetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        timesheet={editing}
        onSave={d => editing ? onUpdate(editing.timesheet_id, d) : onAdd(d)}
      />
    </div>
  );
}
