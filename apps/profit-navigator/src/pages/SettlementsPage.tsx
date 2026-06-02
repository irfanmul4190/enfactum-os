import { Badge } from "@/components/ui/badge";
import { stakeholders } from "@/data/seedData";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtMoney } from "@/lib/formatters";

export default function SettlementsPage() {
  const allData = useAllProjectFinancials();
  const { toSGD } = useCurrency();
  const passThroughProjects = allData.filter(d => d.project.commercial_model === "PARTNER_PASS_THROUGH");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Partner Settlements</h1>
      {passThroughProjects.length === 0 ? (
        <p className="text-muted-foreground">No pass-through projects.</p>
      ) : (
        <div className="grid gap-4">
          {passThroughProjects.map(({ project, financials }) => {
            const partner = stakeholders.find(s => s.stakeholder_id === project.external_partner_stakeholder_id);
            const cur = project.currency || "SGD";
            const showNormalized = cur !== "SGD";
            const norm = (v: number) => showNormalized ? ` (${fmtMoney(toSGD(v, cur), "SGD")})` : "";
            return (
              <div key={project.project_id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-semibold">{project.project_name}</h3>
                  <Badge variant="outline" className="text-xs">Draft</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Partner: {partner?.stakeholder_name}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Partner Revenue</span><div className="tabular-nums mono font-medium mt-0.5">{fmtMoney(financials.partnerRevenue ?? 0, cur)}{norm(financials.partnerRevenue ?? 0)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Flat Fee</span><div className="tabular-nums mono font-medium mt-0.5">{fmtMoney(financials.flatFeeAmount ?? 0, cur)}{norm(financials.flatFeeAmount ?? 0)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Int. Recharge (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtMoney(financials.internalRechargeAmount ?? 0, "SGD")}</div></div>
                  <div><span className="text-muted-foreground text-xs">Net Payable</span><div className="tabular-nums mono font-bold mt-0.5">{fmtMoney(financials.partnerNetPayable ?? 0, cur)}{norm(financials.partnerNetPayable ?? 0)}</div></div>
                  <div><span className="text-muted-foreground text-xs">Enfactum Net Rev (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtMoney(toSGD(financials.enfactumNetRevenue ?? 0, cur), "SGD")}</div></div>
                  <div><span className="text-muted-foreground text-xs">Contribution Margin (SG$)</span><div className="tabular-nums mono font-medium mt-0.5">{fmtMoney(toSGD(financials.contributionMargin ?? 0, cur), "SGD")}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
