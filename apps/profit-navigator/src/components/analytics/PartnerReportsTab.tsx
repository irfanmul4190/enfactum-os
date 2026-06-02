import { useMemo } from "react";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { fmtMoney as fmtCurrency } from "@/lib/formatters";
import { useDataStore } from "@/hooks/useDataStore";
import { Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  data: ProjectWithFinancials[];
}

export function PartnerReportsTab({ data }: Props) {
  const { stakeholders } = useDataStore();

  const partnerData = useMemo(() => {
    const passThrough = data.filter(d => d.project.commercial_model === "PARTNER_PASS_THROUGH");
    return passThrough.map(d => {
      const partner = stakeholders.find(s => s.stakeholder_id === d.project.external_partner_stakeholder_id);
      return {
        project: d.project.project_name,
        partner: partner?.stakeholder_name ?? "N/A",
        partnerRevenue: d.financials.partnerRevenue ?? 0,
        flatFee: d.financials.flatFeeAmount ?? 0,
        recharge: d.financials.internalRechargeAmount ?? 0,
        enfactumNet: d.financials.enfactumNetRevenue ?? 0,
        partnerPayable: d.financials.partnerNetPayable ?? 0,
        contributionMargin: d.financials.contributionMargin ?? 0,
      };
    });
  }, [data, stakeholders]);

  if (partnerData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-10 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No pass-through partner projects found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold mb-4">Partner Revenue Waterfall</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={partnerData} margin={{ left: 10, right: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="project" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-15} textAnchor="end" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => fmtCurrency(v)} />
              <ReTooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [fmtCurrency(v), name]}
              />
              <Legend />
              <Bar dataKey="partnerRevenue" name="Partner Revenue" fill="hsl(var(--chart-2))" maxBarSize={40} radius={[4, 4, 0, 0]} />
              <Bar dataKey="flatFee" name="Enfactum Fee" fill="hsl(var(--primary))" maxBarSize={40} radius={[4, 4, 0, 0]} />
              <Bar dataKey="partnerPayable" name="Partner Payable" fill="hsl(var(--chart-3))" maxBarSize={40} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <h3 className="text-base font-semibold">Partner Settlement Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Partner</th>
                <th className="text-right">Partner Revenue</th>
                <th className="text-right">Flat Fee</th>
                <th className="text-right">Recharge</th>
                <th className="text-right">Enfactum Net</th>
                <th className="text-right">Partner Payable</th>
                <th className="text-right">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {partnerData.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium">{p.project}</td>
                  <td className="text-muted-foreground">{p.partner}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.partnerRevenue)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.flatFee)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.recharge)}</td>
                  <td className="text-right tabular-nums mono">{fmtCurrency(p.enfactumNet)}</td>
                  <td className="text-right tabular-nums mono font-bold">{fmtCurrency(p.partnerPayable)}</td>
                  <td className="text-right tabular-nums mono">
                    <span className={p.contributionMargin >= 0 ? "stat-positive font-medium" : "stat-negative font-medium"}>
                      {fmtCurrency(p.contributionMargin)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
