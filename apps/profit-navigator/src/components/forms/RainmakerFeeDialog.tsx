import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { usePnRainmakerFees, type DbPnRainmakerFee } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  fees: DbPnRainmakerFee[];
  onClose: () => void;
  onSaved: () => void;
}

interface FeeForm {
  rainmaker_name: string;
  fee_type: "percent" | "fixed";
  fee_value: string;
  currency: string;
  notes: string;
}

const EMPTY_FORM: FeeForm = { rainmaker_name: "", fee_type: "percent", fee_value: "", currency: "SGD", notes: "" };

export default function RainmakerFeeDialog({ projectId, fees, onClose, onSaved }: Props) {
  const { addFee, deleteFee } = usePnRainmakerFees();
  const { toast } = useToast();
  const [form, setForm] = useState<FeeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.rainmaker_name.trim() || !form.fee_value) return;
    setSaving(true);
    try {
      await addFee({
        project_id: projectId,
        rainmaker_name: form.rainmaker_name.trim(),
        fee_type: form.fee_type,
        fee_value: parseFloat(form.fee_value),
        currency: form.currency,
        notes: form.notes || null,
      });
      setForm(EMPTY_FORM);
      onSaved();
      toast({ title: "Rainmaker fee added" });
    } catch (err: any) {
      toast({ title: "Failed to add fee", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteFee(id);
      onSaved();
      toast({ title: "Fee removed" });
    } catch (err: any) {
      toast({ title: "Failed to remove fee", description: err?.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rainmaker Fees</DialogTitle>
        </DialogHeader>

        {fees.length > 0 && (
          <div className="space-y-2 mb-4">
            {fees.map(fee => (
              <div key={fee.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border text-sm" style={{ borderColor: "var(--glass-border)" }}>
                <div>
                  <span className="font-medium">{fee.rainmaker_name}</span>
                  <span className="text-muted-foreground ml-2">
                    {fee.fee_type === "percent" ? `${fee.fee_value}%` : `${fee.currency} ${fee.fee_value.toLocaleString()}`}
                  </span>
                  {fee.notes && <p className="text-xs text-muted-foreground mt-0.5">{fee.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive shrink-0"
                  disabled={deleting === fee.id}
                  onClick={() => handleDelete(fee.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--glass-border)" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add New Fee</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Rainmaker Name</Label>
              <Input
                placeholder="e.g. John Smith"
                value={form.rainmaker_name}
                onChange={e => setForm(f => ({ ...f, rainmaker_name: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fee Type</Label>
              <Select value={form.fee_type} onValueChange={v => setForm(f => ({ ...f, fee_type: v as "percent" | "fixed" }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{form.fee_type === "percent" ? "Percentage" : "Amount"}</Label>
              <Input
                type="number"
                placeholder={form.fee_type === "percent" ? "e.g. 5" : "e.g. 5000"}
                value={form.fee_value}
                onChange={e => setForm(f => ({ ...f, fee_value: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            {form.fee_type === "fixed" && (
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["SGD", "USD", "MYR", "IDR", "INR", "AUD"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                placeholder="Any additional notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={saving || !form.rainmaker_name.trim() || !form.fee_value}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {saving ? "Adding…" : "Add Fee"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
