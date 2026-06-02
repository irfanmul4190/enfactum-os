import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDataStore } from "@/hooks/useDataStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { DbMargin } from "@/hooks/useSupabaseData";
import { CheckCircle2, Pencil, Plus, Trash2, X, Save, ShieldCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface MarginsTabProps {
  dealId: string;
  currency: string;
}

const empty: Omit<DbMargin, "id" | "gross_profit" | "gp_percent"> = {
  deal_id: "",
  revenue: 0,
  cost_of_goods: 0,
  cost_of_services: 0,
  mdf_subsidy: 0,
  pricing_notes: null,
  approved: false,
  approved_by: null,
  approved_at: null,
};

function fmtAmt(n: number) {
  return n.toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function MarginsTab({ dealId, currency }: MarginsTabProps) {
  const { margins, insertMargin, updateMargin, deleteMargin, refetchMargins } = useDataStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const canApprove = user.role === "admin" || user.role === "finance" || user.role === "leadership";

  const dealMargins = margins.filter((m) => m.deal_id === dealId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbMargin | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, deal_id: dealId });
    setDialogOpen(true);
  }

  function openEdit(m: DbMargin) {
    setEditing(m);
    setForm({
      deal_id: m.deal_id,
      revenue: m.revenue,
      cost_of_goods: m.cost_of_goods,
      cost_of_services: m.cost_of_services,
      mdf_subsidy: m.mdf_subsidy,
      pricing_notes: m.pricing_notes,
      approved: m.approved,
      approved_by: m.approved_by,
      approved_at: m.approved_at,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateMargin(editing.id, {
          revenue: form.revenue,
          cost_of_goods: form.cost_of_goods,
          cost_of_services: form.cost_of_services,
          mdf_subsidy: form.mdf_subsidy,
          pricing_notes: form.pricing_notes,
        });
        toast({ title: "Margin updated" });
      } else {
        await insertMargin({
          deal_id: form.deal_id,
          revenue: form.revenue,
          cost_of_goods: form.cost_of_goods,
          cost_of_services: form.cost_of_services,
          mdf_subsidy: form.mdf_subsidy,
          pricing_notes: form.pricing_notes,
          approved: false,
          approved_by: null,
          approved_at: null,
        });
        toast({ title: "Margin record created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMargin(id);
      toast({ title: "Margin deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleApprove(m: DbMargin) {
    try {
      await updateMargin(m.id, {
        approved: true,
        approved_at: new Date().toISOString(),
      });
      toast({ title: "Margin approved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const grossProfit = form.revenue - form.cost_of_goods - form.cost_of_services + form.mdf_subsidy;
  const gpPercent = form.revenue > 0 ? (grossProfit / form.revenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Margin Records</h3>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Margin
        </Button>
      </div>

      {dealMargins.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground text-sm">
          No margin records yet. Click "Add Margin" to create one.
        </div>
      ) : (
        <div className="glass-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Revenue</TableHead>
                <TableHead>COGS</TableHead>
                <TableHead>Cost of Services</TableHead>
                <TableHead>MDF Subsidy</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>GP %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealMargins.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="mono tabular-nums">{fmtAmt(m.revenue)}</TableCell>
                  <TableCell className="mono tabular-nums">{fmtAmt(m.cost_of_goods)}</TableCell>
                  <TableCell className="mono tabular-nums">{fmtAmt(m.cost_of_services)}</TableCell>
                  <TableCell className="mono tabular-nums">{fmtAmt(m.mdf_subsidy)}</TableCell>
                  <TableCell className="mono tabular-nums font-medium">{fmtAmt(m.gross_profit)}</TableCell>
                  <TableCell>
                    <Badge variant={m.gp_percent >= 30 ? "default" : "destructive"} className="text-xs">
                      {m.gp_percent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.approved ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canApprove && !m.approved && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => handleApprove(m)}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Notes */}
      {dealMargins.filter(m => m.pricing_notes).map(m => (
        <div key={m.id} className="glass-card p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pricing Notes:</span> {m.pricing_notes}
        </div>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Margin" : "New Margin Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Revenue</label>
              <Input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: +e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cost of Goods</label>
              <Input type="number" value={form.cost_of_goods} onChange={e => setForm(f => ({ ...f, cost_of_goods: +e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cost of Services</label>
              <Input type="number" value={form.cost_of_services} onChange={e => setForm(f => ({ ...f, cost_of_services: +e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">MDF Subsidy</label>
              <Input type="number" value={form.mdf_subsidy} onChange={e => setForm(f => ({ ...f, mdf_subsidy: +e.target.value }))} />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
              <div>
                <span className="text-xs text-muted-foreground">Gross Profit (calc)</span>
                <div className="text-lg font-bold mono tabular-nums">{fmtAmt(grossProfit)}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">GP %</span>
                <div className="text-lg font-bold mono tabular-nums">{gpPercent.toFixed(1)}%</div>
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Pricing Notes</label>
              <Textarea
                value={form.pricing_notes || ""}
                onChange={e => setForm(f => ({ ...f, pricing_notes: e.target.value || null }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
