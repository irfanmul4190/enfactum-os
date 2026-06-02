import { useMemo } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useInvoices } from "@/contexts/InvoiceContext";
import { usePaymentTerms } from "@/contexts/PaymentTermsContext";
import { getOverdueInvoices, BUCKET_CONFIG, TODAY, AgingBucket } from "@/lib/overdueUtils";
import { formatNumber } from "@/data/invoiceData";

const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", "90+"];

export function AgingHeatMap() {
  const { invoices } = useInvoices();
  const { terms } = usePaymentTerms();

  const { unpaid, byBucket, byBucketValue, totalOutstanding, maxVal } = useMemo(() => {
    const overdue = getOverdueInvoices(invoices, TODAY, terms);
    const unpaid = overdue.filter(o => !o.paymentReceivedMonth);
    const totalOutstanding = unpaid.reduce((s, o) => s + o.totalBillingSGD, 0);

    const byBucket: Record<AgingBucket, typeof unpaid> = {
      "current": [], "0-30": [], "31-60": [], "61-90": [], "90+": [],
    };
    const byBucketValue: Record<AgingBucket, number> = {
      "current": 0, "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0,
    };
    unpaid.forEach(o => {
      byBucket[o.agingBucket].push(o);
      byBucketValue[o.agingBucket] += o.totalBillingSGD;
    });

    const maxVal = Math.max(...BUCKETS.map(b => byBucketValue[b]), 1);
    return { unpaid, byBucket, byBucketValue, totalOutstanding, maxVal };
  }, [invoices, terms]);

  return (
    <div className="kpi-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Invoice Aging Heat Map
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            Overdue buckets · unpaid only · {unpaid.length} invoices
          </p>
        </div>
        {unpaid.length === 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "hsl(var(--positive-muted))", color: "hsl(var(--positive))" }}>
            <CheckCircle className="w-3 h-3" /> All Clear
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "hsl(var(--negative) / 0.12)", color: "hsl(var(--negative))" }}>
            <AlertTriangle className="w-3 h-3" />
            SGD {formatNumber(totalOutstanding)} at risk
          </div>
        )}
      </div>

      {/* Heat map grid */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {BUCKETS.map(bucket => {
          const cfg = BUCKET_CONFIG[bucket];
          const count = byBucket[bucket].length;
          const value = byBucketValue[bucket];
          const pct = totalOutstanding > 0 ? (value / totalOutstanding) * 100 : 0;
          const intensity = maxVal > 0 ? value / maxVal : 0;

          // Heat cell background: use the bucket colour at scaled opacity
          const cellBg = count === 0
            ? "hsl(var(--surface-3))"
            : cfg.bg;

          const accounts = [...new Set(byBucket[bucket].map(o => o.account))];

          return (
            <div
              key={bucket}
              className="rounded-xl p-3 border relative overflow-hidden transition-all"
              style={{ background: cellBg, borderColor: count > 0 ? cfg.border : "hsl(var(--border))" }}
            >
              {/* Intensity fill bar behind content */}
              {count > 0 && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: cfg.color,
                    opacity: 0.06 + intensity * 0.14,
                  }}
                />
              )}

              <div className="relative z-10">
                {/* Bucket label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: count > 0 ? cfg.color : "hsl(var(--muted-foreground))" }}>
                    {cfg.label}
                  </span>
                  {count > 0 && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${cfg.color}22`, color: cfg.color }}>
                      {pct.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Count + value */}
                <div className="mono text-2xl font-bold mb-0.5" style={{ color: count > 0 ? cfg.color : "hsl(var(--muted-foreground))" }}>
                  {count}
                </div>
                <div className="text-xs font-medium mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {count === 0 ? "invoices" : count === 1 ? "invoice" : "invoices"}
                </div>

                {value > 0 && (
                  <div className="mono text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    SGD {formatNumber(value)}
                  </div>
                )}

                {/* Account pills */}
                {accounts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {accounts.slice(0, 3).map(a => (
                      <span key={a} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--muted-foreground))" }}>
                        {a}
                      </span>
                    ))}
                    {accounts.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--muted-foreground))" }}>
                        +{accounts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked bar */}
      {unpaid.length > 0 && (
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {BUCKETS.map(b => {
              const pct = totalOutstanding > 0 ? (byBucketValue[b] / totalOutstanding) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div key={b} className="h-full" style={{ width: `${pct}%`, background: BUCKET_CONFIG[b].color }}
                  title={`${BUCKET_CONFIG[b].label}: ${pct.toFixed(0)}%`} />
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {BUCKETS.filter(b => byBucketValue[b] > 0).map(b => (
              <div key={b} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: BUCKET_CONFIG[b].color }} />
                <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{BUCKET_CONFIG[b].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
