import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { vendors as allVendors } from "@/data/seedData";
import { fmtMoney } from "@/lib/formatters";
import { CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { Plus, Pencil, Trash2 } from "lucide-react";
import VendorCostFormDialog from "@/components/forms/VendorCostFormDialog";
import type { VendorCost, OtherCost, ProjectFinancials } from "@/data/types";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  currency: string;
  isForeign: boolean;
  vendorCosts: VendorCost[];
  otherCosts: OtherCost[];
  financials: ProjectFinancials;
  toSGD: (amount: number, cur: string) => number;
  onAddVendorCost: (data: any) => void;
  onUpdateVendorCost: (id: string, data: any) => void;
  onDeleteVendorCost: (id: string) => void;
}

export function CostsTab({ projectId, currency, isForeign, vendorCosts, otherCosts, financials, toSGD, onAddVendorCost, onUpdateVendorCost, onDeleteVendorCost }: Props) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorCost | null>(null);

  const cur = currency;
  const prefix = CURRENCY_SYMBOLS[cur] || cur;
  const fmt = (amount: number) => fmtMoney(amount, cur);
  const fmtSGD = (amount: number) => fmtMoney(amount, "SGD");
  const fmtNorm = (amount: number) => fmtSGD(toSGD(amount, cur));

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Vendor Costs</h3>
          <button className="btn-glass" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" />Add</button>
        </div>
        <div className="overflow-x-auto">
          {vendorCosts.length === 0 ? (
            <p className="px-4 py-6 text-center text-muted-foreground">No vendor costs for this project.</p>
          ) : (
            <table className="w-full data-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="text-right">Actual ({prefix})</th>
                  {isForeign && <th className="text-right">Actual (SG$)</th>}
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorCosts.map(v => {
                  const vendor = allVendors.find(vn => vn.vendor_id === v.vendor_id);
                  return (
                    <tr key={v.vendor_cost_id}>
                      <td className="font-medium">{vendor?.vendor_name ?? v.vendor_id}</td>
                      <td className="text-muted-foreground">{v.cost_category}</td>
                      <td>{v.cost_type}</td>
                      <td className="text-right tabular-nums mono">{fmt(v.actual_amount)}</td>
                      {isForeign && <td className="text-right tabular-nums mono">{fmtNorm(v.actual_amount)}</td>}
                      <td><Badge variant="secondary" className="text-xs">{v.payment_status}</Badge></td>
                      <td className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(v); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { onDeleteVendorCost(v.vendor_cost_id); toast({ title: "Vendor cost deleted" }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Other Costs</h3>
        </div>
        <div className="overflow-x-auto">
          {otherCosts.length === 0 ? (
            <p className="px-4 py-6 text-center text-muted-foreground">No other costs for this project.</p>
          ) : (
            <table className="w-full data-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Category</th>
                  <th className="text-right">Actual ({prefix})</th>
                  {isForeign && <th className="text-right">Actual (SG$)</th>}
                </tr>
              </thead>
              <tbody>
                {otherCosts.map(o => (
                  <tr key={o.other_cost_id}>
                    <td className="font-medium">{o.category}</td>
                    <td className="text-right tabular-nums mono">{fmt(o.actual_amount)}</td>
                    {isForeign && <td className="text-right tabular-nums mono">{fmtNorm(o.actual_amount)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Cost Summary (SG$ normalized)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">Internal Cost (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtSGD(financials.internalCost)}</div></div>
          <div><span className="text-muted-foreground text-xs">Vendor Cost (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtSGD(toSGD(financials.vendorCost, cur))}</div></div>
          <div><span className="text-muted-foreground text-xs">Other Cost (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtSGD(toSGD(financials.otherCost, cur))}</div></div>
          <div><span className="text-muted-foreground text-xs">Total Costs (SG$)</span><div className="tabular-nums mono font-bold mt-0.5">{fmtSGD(financials.internalCost + toSGD(financials.vendorCost, cur) + toSGD(financials.otherCost, cur))}</div></div>
        </div>
      </div>

      <VendorCostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        vendorCost={editing}
        onSave={d => editing ? onUpdateVendorCost(editing.vendor_cost_id, d) : onAddVendorCost(d)}
      />
    </div>
  );
}
