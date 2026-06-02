import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { fmtPercent, fmtNumber, fmtMoney } from "@/lib/formatters";
import { ArrowLeft, AlertTriangle, Info, ChevronRight } from "lucide-react";
import type { ProjectWithFinancials } from "@/hooks/useProjectFinancials";
import { isPayoutGuardrailTriggered, isGrossMarginBelowTarget } from "@/lib/financials";

interface Props {
  data: ProjectWithFinancials;
  toSGD: (amount: number, cur: string) => number;
  fxRate: number | undefined;
  lastUpdated: Date | null;
  referrer?: "dashboard" | "projects" | null;
}

export function ProjectHeader({ data, toSGD, fxRate, lastUpdated, referrer }: Props) {
  const { project, client, financials } = data;
  const cur = project.currency || "SGD";
  const prefix = CURRENCY_SYMBOLS[cur] || cur;
  const isPassThrough = project.commercial_model === "PARTNER_PASS_THROUGH";
  const isForeign = cur !== "SGD";
  const gmWarning = isGrossMarginBelowTarget(financials.grossMarginPct, project.margin_target_percent);
  const guardrailTriggered = isPayoutGuardrailTriggered(financials, isPassThrough);

  const fmt = (amount: number) => fmtMoney(amount, cur);
  const fmtSGD = (amount: number) => fmtMoney(amount, "SGD");
  const fmtNorm = (amount: number) => fmtSGD(toSGD(amount, cur));

  return (
    <>
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        {referrer === "dashboard" ? (
          <>
            <Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[250px]">{project.project_name}</span>
      </nav>
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{project.project_name}</h1>
          <div className="flex gap-2 items-center mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">{project.project_code}</span>
            <Badge variant="secondary" className="text-xs">{client?.client_name}</Badge>
            <Badge variant={isPassThrough ? "outline" : "default"} className="text-xs">
              {isPassThrough ? "Pass-Through" : "Enfactum-Led"}
            </Badge>
            <Badge variant="secondary" className="text-xs">{project.status}</Badge>
            <Badge variant="outline" className="text-xs font-mono">Project Currency: {prefix}</Badge>
          </div>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      {isPassThrough ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Partner Revenue", val: fmt(financials.partnerRevenue ?? 0) },
              { label: "Flat Fee", val: fmt(financials.flatFeeAmount ?? 0) },
              { label: "Int. Recharge", val: fmtSGD(financials.internalRechargeAmount ?? 0) },
              { label: "Enfactum Net Rev", val: fmt(financials.enfactumNetRevenue ?? 0) },
              { label: "Int. Cost", val: fmtSGD(financials.enfactumInternalCost ?? 0) },
              { label: "Contribution Margin", val: fmt(financials.contributionMargin ?? 0) },
              { label: "Partner Net Payable", val: fmt(financials.partnerNetPayable ?? 0) },
            ].map(item => (
              <div key={item.label} className="kpi-card">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold tabular-nums mono mt-1">{item.val}</p>
              </div>
            ))}
          </div>
          {isForeign && (
            <div className="text-xs text-muted-foreground px-1">
              Normalized (SG$): Enfactum Net Rev {fmtNorm(financials.enfactumNetRevenue ?? 0)} · Contribution Margin {fmtNorm(financials.contributionMargin ?? 0)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: `Revenue (${prefix})`, val: fmt(financials.revenueUsed) },
              { label: "Internal Cost (SG$)", val: fmtSGD(financials.internalCost) },
              { label: `Vendor Cost (${prefix})`, val: fmt(financials.vendorCost) },
              { label: `Other Cost (${prefix})`, val: fmt(financials.otherCost) },
              { label: "Gross Margin", val: fmt(financials.grossMargin), warn: gmWarning },
              { label: "Net After Payouts", val: fmt(financials.netMarginAfterPayouts) },
            ].map(item => (
              <div key={item.label} className="kpi-card">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold tabular-nums mono mt-1 ${'warn' in item && item.warn ? 'stat-negative' : ''}`}>{item.val}</p>
              </div>
            ))}
          </div>

          {isForeign && (
            <div className="glass-card px-4 py-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1"><Info className="h-3.5 w-3.5" />SG$ Normalized View</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><span className="text-muted-foreground">Revenue (SG$)</span><div className="tabular-nums mono font-medium">{fmtNorm(financials.revenueUsed)}</div></div>
                <div><span className="text-muted-foreground">Total Costs (SG$)</span><div className="tabular-nums mono font-medium">{fmtSGD(toSGD(financials.internalCost + financials.vendorCost + financials.otherCost, cur))}</div></div>
                <div><span className="text-muted-foreground">Gross Margin (SG$)</span><div className="tabular-nums mono font-medium">{fmtNorm(financials.grossMargin)}</div></div>
                <div><span className="text-muted-foreground">Net After Payouts (SG$)</span><div className="tabular-nums mono font-medium">{fmtNorm(financials.netMarginAfterPayouts)}</div></div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground px-1 tabular-nums">
            GM%: {fmtPercent(financials.grossMarginPct)} · Target: {project.margin_target_percent}%
          </div>
        </div>
      )}

      {/* FX Rate Note */}
      {isForeign && fxRate && (
        <div className="text-[11px] text-muted-foreground px-1 flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          FX used: 1 {cur} = {fmtNumber(fxRate, 4)} SGD
          {lastUpdated && ` (last updated ${lastUpdated.toLocaleString()})`}
        </div>
      )}

      {(gmWarning || guardrailTriggered) && (
        <div className="flex items-center gap-2 text-sm stat-negative rounded-xl px-4 py-2" style={{ background: "hsl(var(--negative-muted))" }}>
          <AlertTriangle className="h-4 w-4" />
          {gmWarning && <span>GM% ({fmtPercent(financials.grossMarginPct)}) below target ({project.margin_target_percent}%)</span>}
          {guardrailTriggered && <span className="ml-2">⚠ Payouts exceed 40% of Enfactum Net Revenue — Finance+CEO approval required</span>}
        </div>
      )}
    </>
  );
}
