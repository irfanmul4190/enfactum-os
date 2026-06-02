import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2, Calculator, Save, X } from "lucide-react";
import { fmtMoney, fmtPercent } from "@/lib/formatters";
import { calculateGrossMargin, calculateNetMargin, calculateGrossMarginPct } from "@/lib/financials";

const ROLES = ["Rainmaker", "Project Lead", "Internal Partner", "External Partner", "Other"];

interface StakeholderRow {
  id: string;
  name: string;
  role: string;
  splitPercent: number;
  floorAmount: number;
  capAmount: number;
}

interface ComputedStakeholder extends StakeholderRow {
  rawPayout: number;
  finalPayout: number;
  effectivePct: number;
}

let rowId = 0;
const nextRowId = () => `sim-row-${++rowId}`;

function createEmptyRow(): StakeholderRow {
  return { id: nextRowId(), name: "", role: "Rainmaker", splitPercent: 0, floorAmount: 0, capAmount: 0 };
}

interface PayoutSimulatorProps {
  /** If provided, pre-fills the simulator with project data */
  initialRevenue?: number;
  initialInternalCost?: number;
  initialVendorCost?: number;
  initialOtherCost?: number;
  currency?: string;
}

export function PayoutSimulator({
  initialRevenue = 0,
  initialInternalCost = 0,
  initialVendorCost = 0,
  initialOtherCost = 0,
  currency = "SGD",
}: PayoutSimulatorProps) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [internalCost, setInternalCost] = useState(initialInternalCost);
  const [vendorCost, setVendorCost] = useState(initialVendorCost);
  const [otherCost, setOtherCost] = useState(initialOtherCost);
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([createEmptyRow()]);

  const fmt = useCallback((v: number) => fmtMoney(v, currency), [currency]);

  const addRow = useCallback(() => {
    setStakeholders(prev => [...prev, createEmptyRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setStakeholders(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: keyof StakeholderRow, value: string | number) => {
    setStakeholders(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  // ─── Live calculations ────────────────────────────────────────
  const results = useMemo(() => {
    const grossMargin = calculateGrossMargin(revenue, internalCost, vendorCost, otherCost);
    const grossMarginPct = calculateGrossMarginPct(revenue, grossMargin);

    // Payout base = gross margin (after all costs)
    const payoutBase = grossMargin;

    const computed: ComputedStakeholder[] = stakeholders.map(s => {
      let raw = payoutBase * (s.splitPercent / 100);

      // Apply cap
      let capped = raw;
      if (s.capAmount > 0) {
        capped = Math.min(raw, s.capAmount);
      }

      // Apply floor
      let floored = capped;
      if (s.floorAmount > 0) {
        floored = Math.max(capped, s.floorAmount);
      }

      const finalPayout = Math.max(0, floored);

      return {
        ...s,
        rawPayout: raw,
        finalPayout,
        effectivePct: revenue > 0 ? finalPayout / revenue : 0,
      };
    });

    const totalPayouts = computed.reduce((s, c) => s + c.finalPayout, 0);
    const netMargin = calculateNetMargin(grossMargin, totalPayouts);
    const netMarginPct = calculateGrossMarginPct(revenue, netMargin);
    const guardrailTriggered = revenue > 0 && totalPayouts > 0.4 * revenue;

    return { grossMargin, grossMarginPct, computed, totalPayouts, netMargin, netMarginPct, guardrailTriggered };
  }, [revenue, internalCost, vendorCost, otherCost, stakeholders]);

  return (
    <div className="space-y-6">
      {/* ─── Inputs ─────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Revenue & Costs</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Gross Revenue</Label>
            <Input
              type="number"
              min={0}
              value={revenue}
              onChange={e => setRevenue(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Internal Costs</Label>
            <Input
              type="number"
              min={0}
              value={internalCost}
              onChange={e => setInternalCost(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vendor Costs</Label>
            <Input
              type="number"
              min={0}
              value={vendorCost}
              onChange={e => setVendorCost(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Other Costs</Label>
            <Input
              type="number"
              min={0}
              value={otherCost}
              onChange={e => setOtherCost(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* ─── Stakeholders ───────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Stakeholder Splits</h3>
          <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Row
          </Button>
        </div>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_80px_100px_100px_32px] gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
            <span>Name</span>
            <span>Role</span>
            <span>Split %</span>
            <span>Floor (SG$)</span>
            <span>Cap (SG$)</span>
            <span></span>
          </div>
          {stakeholders.map(row => (
            <div key={row.id} className="grid grid-cols-[1fr_120px_80px_100px_100px_32px] gap-2 items-center">
              <Input
                value={row.name}
                onChange={e => updateRow(row.id, "name", e.target.value)}
                placeholder="Stakeholder name"
                maxLength={100}
                className="h-8 text-xs"
              />
              <Select value={row.role} onValueChange={v => updateRow(row.id, "role", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                max={100}
                value={row.splitPercent}
                onChange={e => updateRow(row.id, "splitPercent", Number(e.target.value))}
                className="h-8 text-xs tabular-nums"
              />
              <Input
                type="number"
                min={0}
                value={row.floorAmount}
                onChange={e => updateRow(row.id, "floorAmount", Number(e.target.value))}
                className="h-8 text-xs tabular-nums"
              />
              <Input
                type="number"
                min={0}
                value={row.capAmount}
                onChange={e => updateRow(row.id, "capAmount", Number(e.target.value))}
                className="h-8 text-xs tabular-nums"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(row.id)}
                disabled={stakeholders.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Guardrail Warning ──────────────────────────────────── */}
      {results.guardrailTriggered && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 stat-negative" style={{ background: "hsl(var(--negative-muted))" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Guardrail triggered:</strong> Total payouts ({fmtPercent(results.totalPayouts / revenue)}) exceed 40% of gross revenue.
            Finance + CEO approval required.
          </span>
        </div>
      )}

      {/* ─── Output Panel ───────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-sm font-semibold">Simulation Results</h3>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Margin</p>
            <p className="text-lg font-bold tabular-nums mono mt-0.5">{fmt(results.grossMargin)}</p>
            <p className="text-xs text-muted-foreground">{fmtPercent(results.grossMarginPct)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Payouts</p>
            <p className="text-lg font-bold tabular-nums mono mt-0.5">{fmt(results.totalPayouts)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Margin</p>
            <p className={`text-lg font-bold tabular-nums mono mt-0.5 ${results.netMargin < 0 ? "stat-negative" : ""}`}>
              {fmt(results.netMargin)}
            </p>
            <p className="text-xs text-muted-foreground">{fmtPercent(results.netMarginPct)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payout Ratio</p>
            <p className={`text-lg font-bold tabular-nums mono mt-0.5 ${results.guardrailTriggered ? "stat-negative" : ""}`}>
              {revenue > 0 ? fmtPercent(results.totalPayouts / revenue) : "—"}
            </p>
          </div>
        </div>

        {/* Stakeholder Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Stakeholder</th>
                <th>Role</th>
                <th className="text-right">Split %</th>
                <th className="text-right">Raw Payout</th>
                <th className="text-right">Final Payout</th>
                <th className="text-right">Eff. % of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {results.computed.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name || <span className="text-muted-foreground italic">Unnamed</span>}</td>
                  <td className="text-muted-foreground text-xs">{c.role}</td>
                  <td className="text-right tabular-nums mono">{c.splitPercent}%</td>
                  <td className="text-right tabular-nums mono text-muted-foreground">{fmt(c.rawPayout)}</td>
                  <td className="text-right tabular-nums mono font-medium">{fmt(c.finalPayout)}</td>
                  <td className="text-right tabular-nums mono">{fmtPercent(c.effectivePct)}</td>
                </tr>
              ))}
              <tr style={{ background: "hsl(var(--surface-3))" }}>
                <td colSpan={4} className="text-right font-bold">Total Payouts</td>
                <td className="text-right tabular-nums mono font-bold">{fmt(results.totalPayouts)}</td>
                <td className="text-right tabular-nums mono font-bold">
                  {revenue > 0 ? fmtPercent(results.totalPayouts / revenue) : "—"}
                </td>
              </tr>
              <tr style={{ background: "hsl(var(--surface-3))" }}>
                <td colSpan={4} className="text-right font-bold">Net Margin (After Payouts)</td>
                <td className={`text-right tabular-nums mono font-bold ${results.netMargin < 0 ? "stat-negative" : ""}`}>
                  {fmt(results.netMargin)}
                </td>
                <td className="text-right tabular-nums mono font-bold">
                  {fmtPercent(results.netMarginPct)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Preset placeholder */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled className="text-xs">
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save as Preset
        </Button>
      </div>
    </div>
  );
}
