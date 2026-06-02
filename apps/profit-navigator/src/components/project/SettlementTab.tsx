import { stakeholders } from "@/data/seedData";
import { fmtMoney, fmtNumber } from "@/lib/formatters";
import type { ProjectFinancials, Project } from "@/data/types";

interface Props {
  project: Project;
  financials: ProjectFinancials;
  toSGD: (amount: number, cur: string) => number;
}

export function SettlementTab({ project, financials, toSGD }: Props) {
  const cur = project.currency || "SGD";
  const isForeign = cur !== "SGD";
  const fmt = (amount: number) => fmtMoney(amount, cur);
  const fmtSGD = (amount: number) => fmtMoney(amount, "SGD");
  const fmtNorm = (amount: number) => fmtSGD(toSGD(amount, cur));

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <h3 className="text-base font-semibold">Partner Settlement Statement</h3>
      </div>
      <div className="p-5">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <span className="text-muted-foreground">Partner</span>
            <span className="font-medium">{stakeholders.find(s => s.stakeholder_id === project.external_partner_stakeholder_id)?.stakeholder_name}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <span className="text-muted-foreground">Partner Revenue Basis</span>
            <span className="tabular-nums mono">
              {fmt(financials.partnerRevenue ?? 0)}
              {isForeign && <span className="text-muted-foreground ml-2">({fmtNorm(financials.partnerRevenue ?? 0)})</span>}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <span className="text-muted-foreground">Flat Fee ({project.flat_fee_percent}%)</span>
            <span className="tabular-nums mono">
              ({fmt(financials.flatFeeAmount ?? 0)})
              {isForeign && <span className="text-muted-foreground ml-2">({fmtNorm(financials.flatFeeAmount ?? 0)})</span>}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <span className="text-muted-foreground">Internal Recharge (SG$)</span>
            <span className="tabular-nums mono">({fmtSGD(financials.internalRechargeAmount ?? 0)})</span>
          </div>
          <div className="flex justify-between py-2 border-b font-bold" style={{ borderColor: "var(--glass-border)" }}>
            <span>Net Payable to Partner</span>
            <span className="tabular-nums mono">
              {fmt(financials.partnerNetPayable ?? 0)}
              {isForeign && <span className="text-muted-foreground font-normal ml-2">({fmtNorm(financials.partnerNetPayable ?? 0)})</span>}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
              <span className="text-muted-foreground">Enfactum Net Revenue (SG$)</span>
              <span className="tabular-nums mono">{fmtSGD(toSGD(financials.enfactumNetRevenue ?? 0, cur))}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--glass-border)" }}>
              <span className="text-muted-foreground">Enfactum Internal Cost (SG$)</span>
              <span className="tabular-nums mono">({fmtSGD(financials.enfactumInternalCost ?? 0)})</span>
            </div>
            <div className="flex justify-between py-2 font-bold">
              <span>Contribution Margin (SG$)</span>
              <span className="tabular-nums mono">{fmtSGD(toSGD(financials.contributionMargin ?? 0, cur))}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Payout basis: {project.pass_through_payout_basis?.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </div>
  );
}
