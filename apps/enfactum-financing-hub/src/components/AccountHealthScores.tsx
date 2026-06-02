import { useMemo } from "react";
import { Shield, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useInvoices } from "@/contexts/InvoiceContext";
import { usePaymentTerms } from "@/contexts/PaymentTermsContext";
import { getOverdueInvoices, TODAY } from "@/lib/overdueUtils";
import { formatNumber, fy2025Monthly } from "@/data/invoiceData";
import { useActiveAccountNames } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";

// Hardcoded ACCOUNTS_TO_SCORE list removed 2026-05-19. The component now
// derives the list from useActiveAccountNames() so adding/removing accounts
// happens in the database, not in source.

const QUARTER_MONTHS = [
  ["Apr","May","Jun"],
  ["Jul","Aug","Sep"],
  ["Oct","Nov","Dec"],
  ["Jan","Feb","Mar"],
];

function ScoreBadge({ score }: { score: number }) {
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "D";
  const color = score >= 80 ? "hsl(var(--positive))" : score >= 65 ? "hsl(var(--warning))" : score >= 50 ? "hsl(38 90% 45%)" : "hsl(var(--negative))";
  const bg = score >= 80 ? "hsl(var(--positive-muted))" : score >= 65 ? "hsl(var(--warning-muted))" : score >= 50 ? "hsl(38 90% 15%)" : "hsl(var(--negative-muted))";
  return (
    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 font-black text-lg"
      style={{ background: bg, borderColor: color, color }}>
      {grade}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 rounded-full overflow-hidden w-full" style={{ background: "hsl(var(--surface-4))" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  );
}

interface AccountScore {
  account: string;
  totalRevenue: number;
  paymentScore: number;
  trendScore: number;
  overdueScore: number;
  composite: number;
  trendDir: "up" | "down" | "flat";
  overdueCount: number;
  unpaidCount: number;
}

export function AccountHealthScores() {
  const { invoices } = useInvoices();
  const { terms } = usePaymentTerms();
  const accountsToScore = useActiveAccountNames();

  const scores = useMemo((): AccountScore[] => {
    const overdueList = getOverdueInvoices(invoices, TODAY, terms);
    const fy25 = invoices.filter(i => i.fiscalYear === "FY2025");

    return accountsToScore.map(account => {
      const accountInvoices = fy25.filter(i => i.account === account);
      if (accountInvoices.length === 0) return null;

      const totalRevenue = accountInvoices.reduce((s, i) => s + i.totalBillingSGD, 0);

      // ── 1. Payment Speed Score (0–100) ──────────────────────────────────
      const paid = accountInvoices.filter(i => i.paymentReceivedMonth);
      const unpaidCount = accountInvoices.filter(i => !i.paymentReceivedMonth && i.totalBillingSGD > 0).length;
      const totalCount = accountInvoices.length;
      const payRate = totalCount > 0 ? (paid.length / totalCount) : 1;
      const paymentScore = Math.round(payRate * 100);

      // ── 2. Revenue Trend Score (0–100) ───────────────────────────────────
      // Compare Q3 (Oct–Dec) vs Q4 so far (Jan-Feb)
      const q3Total = QUARTER_MONTHS[2].reduce((s, m) => {
        return s + accountInvoices.filter(i => i.month.startsWith(m)).reduce((ss, i) => ss + i.totalBillingSGD, 0);
      }, 0);
      const q4Total = ["Jan","Feb"].reduce((s, m) => {
        return s + accountInvoices.filter(i => i.month.startsWith(m)).reduce((ss, i) => ss + i.totalBillingSGD, 0);
      }, 0);
      // Annualise Q4 partial (2 months → 3)
      const q4Ann = q4Total * (3 / 2);
      let trendScore = 50;
      if (q3Total > 0) {
        const growth = (q4Ann - q3Total) / q3Total;
        trendScore = Math.round(Math.min(100, Math.max(0, 50 + growth * 50)));
      }

      // ── 3. Overdue Risk Score (0–100, higher = healthier) ────────────────
      const accountOverdue = overdueList.filter(o => o.account === account && !o.paymentReceivedMonth);
      const overdueValue = accountOverdue.reduce((s, o) => s + o.totalBillingSGD, 0);
      let overdueScore = 100;
      if (totalRevenue > 0) {
        const overdueRatio = overdueValue / totalRevenue;
        overdueScore = Math.round(Math.max(0, 100 - overdueRatio * 200));
      }

      // ── Composite score (weighted) ────────────────────────────────────────
      const composite = Math.round(paymentScore * 0.4 + trendScore * 0.35 + overdueScore * 0.25);

      // ── Trend direction ───────────────────────────────────────────────────
      const trendDir = q3Total === 0 ? "flat" : q4Ann > q3Total * 1.05 ? "up" : q4Ann < q3Total * 0.95 ? "down" : "flat";

      return {
        account,
        totalRevenue,
        paymentScore,
        trendScore,
        overdueScore,
        composite,
        trendDir: trendDir as "up" | "down" | "flat",
        overdueCount: accountOverdue.length,
        unpaidCount,
      } as AccountScore;
    }).filter((s): s is AccountScore => s !== null).sort((a, b) => b.composite - a.composite);
  }, [invoices, terms]);

  const validScores = scores;

  return (
    <div className="kpi-card">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Account Health Scores — FY2025</h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Composite of payment speed (40%) · revenue trend (35%) · overdue risk (25%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {validScores.map((s) => (
          <div key={s.account} className="rounded-xl p-4 border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
            <div className="flex items-start gap-3">
              <ScoreBadge score={s.composite} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>{s.account}</div>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.trendDir === "up" && <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(var(--positive))" }} />}
                    {s.trendDir === "down" && <TrendingDown className="w-3.5 h-3.5" style={{ color: "hsl(var(--negative))" }} />}
                    <span className="mono text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>{s.composite}</span>
                  </div>
                </div>
                <div className="text-xs mt-0.5 mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                  SGD {formatNumber(s.totalRevenue)} YTD
                </div>
              </div>
            </div>

            {/* Score breakdown bars */}
            <div className="mt-3 space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Clock className="w-3 h-3 inline mr-1" />Payment Speed
                  </span>
                  <span className="mono font-semibold" style={{ color: s.paymentScore >= 70 ? "hsl(var(--positive))" : "hsl(var(--warning))" }}>
                    {s.paymentScore}
                  </span>
                </div>
                <MiniBar value={s.paymentScore} max={100} color={s.paymentScore >= 70 ? "hsl(var(--positive))" : "hsl(var(--warning))"} />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    <TrendingUp className="w-3 h-3 inline mr-1" />Rev Trend
                  </span>
                  <span className="mono font-semibold" style={{ color: s.trendScore >= 60 ? "hsl(var(--positive))" : s.trendScore >= 40 ? "hsl(var(--warning))" : "hsl(var(--negative))" }}>
                    {s.trendScore}
                  </span>
                </div>
                <MiniBar value={s.trendScore} max={100}
                  color={s.trendScore >= 60 ? "hsl(var(--positive))" : s.trendScore >= 40 ? "hsl(var(--warning))" : "hsl(var(--negative))"} />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    <AlertTriangle className="w-3 h-3 inline mr-1" />Overdue Risk
                  </span>
                  <span className="mono font-semibold" style={{ color: s.overdueScore >= 80 ? "hsl(var(--positive))" : s.overdueScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--negative))" }}>
                    {s.overdueScore}
                  </span>
                </div>
                <MiniBar value={s.overdueScore} max={100}
                  color={s.overdueScore >= 80 ? "hsl(var(--positive))" : s.overdueScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--negative))"} />
              </div>
            </div>

            {/* Status chips */}
            {(s.overdueCount > 0 || s.unpaidCount > 0) && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {s.overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "hsl(var(--negative-muted))", color: "hsl(var(--negative))" }}>
                    {s.overdueCount} overdue
                  </span>
                )}
                {s.unpaidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))" }}>
                    {s.unpaidCount} unpaid
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        {[
          { grade: "A", label: "Excellent (80–100)", color: "hsl(var(--positive))" },
          { grade: "B", label: "Good (65–79)", color: "hsl(var(--warning))" },
          { grade: "C", label: "Watch (50–64)", color: "hsl(38 90% 45%)" },
          { grade: "D", label: "At Risk (<50)", color: "hsl(var(--negative))" },
        ].map(({ grade, label, color }) => (
          <div key={grade} className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded font-bold text-xs flex items-center justify-center border-2"
              style={{ borderColor: color, color }}>
              {grade}
            </div>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
