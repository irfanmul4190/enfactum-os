import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/formatters";
import type { ProjectFinancials, ProjectStakeholderSplit } from "@/data/types";

interface Props {
  financials: ProjectFinancials;
  splits: ProjectStakeholderSplit[];
  currency: string;
}

export function StakeholdersTab({ financials, splits, currency }: Props) {
  const fmt = (amount: number) => fmtMoney(amount, currency);
  const prefix = currency === "USD" ? "US$" : currency === "SGD" ? "SG$" : currency;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <h3 className="text-base font-semibold">Stakeholder Splits & Payouts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead className="sticky top-0 z-10">
            <tr>
              <th>Stakeholder</th>
              <th>Role</th>
              <th>Model</th>
              <th className="text-right">Value</th>
              <th>Cap</th>
              <th>Floor</th>
              <th className="text-right">Payout ({prefix})</th>
            </tr>
          </thead>
          <tbody>
            {financials.payouts.map(p => (
              <tr key={p.split_id}>
                <td className="font-medium">{p.stakeholder_name}</td>
                <td className="text-muted-foreground">{p.role_on_project}</td>
                <td><Badge variant="outline" className="text-xs">{p.payout_model.replace(/_/g, ' ')}</Badge></td>
                <td className="text-right tabular-nums mono">{p.payout_model === "FIXED_AMOUNT" ? fmt(p.payout_value) : `${p.payout_value}%`}</td>
                <td className="text-xs text-muted-foreground">
                  {splits.find(s => s.split_id === p.split_id)?.cap_type !== "NO_CAP"
                    ? `${splits.find(s => s.split_id === p.split_id)?.cap_type?.replace(/_/g, ' ')} ${splits.find(s => s.split_id === p.split_id)?.cap_value}` : "—"}
                </td>
                <td className="text-xs text-muted-foreground">
                  {splits.find(s => s.split_id === p.split_id)?.floor_type !== "NO_FLOOR"
                    ? `${splits.find(s => s.split_id === p.split_id)?.floor_type?.replace(/_/g, ' ')} ${splits.find(s => s.split_id === p.split_id)?.floor_value}` : "—"}
                </td>
                <td className="text-right tabular-nums mono font-bold">{fmt(p.final_amount)}</td>
              </tr>
            ))}
            <tr style={{ background: "hsl(var(--surface-3))" }}>
              <td colSpan={6} className="text-right font-bold">Total Payouts</td>
              <td className="text-right tabular-nums mono font-bold">{fmt(financials.totalPayouts)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
