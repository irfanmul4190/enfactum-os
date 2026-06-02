import { useMemo, useState } from "react";
import { Download, Receipt, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useInvoices } from "@/contexts/InvoiceContext";
import { cn } from "@/lib/utils";

const GST_RATE = 0.09;

interface MonthlyGSTRow {
  month: string;
  fiscalYear: string;
  invoiceCount: number;
  gstableRevenue: number;  // ex-tax SGD for GST invoices
  gstCollected: number;    // 9% of above
  nonGstRevenue: number;   // ex-tax SGD for non-GST
  totalBillingSGD: number;
  paidGST: number;         // GST from paid invoices
  pendingGST: number;      // GST from unpaid invoices
  invoices: Array<{
    invoiceNumber: string;
    company: string;
    account: string;
    exTaxSGD: number;
    gstAmount: number;
    totalSGD: number;
    hasGST: boolean;
    paid: boolean;
    currency: string;
  }>;
}

const MONTH_ORDER = [
  "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
];

function monthSortKey(monthLabel: string): number {
  const [m] = monthLabel.split("-");
  return MONTH_ORDER.indexOf(m);
}

export function GSTReport() {
  const { invoices } = useInvoices();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [filterFY, setFilterFY] = useState<string>("All");

  const fiscalYears = useMemo(() => {
    const fys = [...new Set(invoices.map(i => i.fiscalYear))].sort();
    return ["All", ...fys];
  }, [invoices]);

  const monthlyData = useMemo<MonthlyGSTRow[]>(() => {
    const map: Record<string, MonthlyGSTRow> = {};

    invoices.forEach(inv => {
      if (filterFY !== "All" && inv.fiscalYear !== filterFY) return;

      const key = inv.month;
      if (!map[key]) {
        map[key] = {
          month: inv.month,
          fiscalYear: inv.fiscalYear,
          invoiceCount: 0,
          gstableRevenue: 0,
          gstCollected: 0,
          nonGstRevenue: 0,
          totalBillingSGD: 0,
          paidGST: 0,
          pendingGST: 0,
          invoices: [],
        };
      }

      const row = map[key];

      // Compute ex-tax and GST in SGD
      let exTaxSGD = 0;
      let gstAmount = 0;

      if (inv.currency === "SGD") {
        exTaxSGD = inv.amountSGDExTax ?? 0;
        gstAmount = inv.hasGST ? (inv.amountSGDWithTax ?? 0) - exTaxSGD : 0;
      } else {
        // USD invoice — use totalBillingSGD as the converted amount
        // We can't perfectly back-calculate ex-tax, so derive from totalBillingSGD
        if (inv.hasGST) {
          exTaxSGD = inv.totalBillingSGD / (1 + GST_RATE);
          gstAmount = inv.totalBillingSGD - exTaxSGD;
        } else {
          exTaxSGD = inv.totalBillingSGD;
          gstAmount = 0;
        }
      }

      row.invoiceCount++;
      row.totalBillingSGD += inv.totalBillingSGD;

      if (inv.hasGST) {
        row.gstableRevenue += exTaxSGD;
        row.gstCollected += gstAmount;
        if (inv.paymentReceivedMonth) {
          row.paidGST += gstAmount;
        } else {
          row.pendingGST += gstAmount;
        }
      } else {
        row.nonGstRevenue += exTaxSGD;
      }

      row.invoices.push({
        invoiceNumber: inv.invoiceNumber,
        company: inv.company,
        account: inv.account,
        exTaxSGD,
        gstAmount,
        totalSGD: inv.totalBillingSGD,
        hasGST: inv.hasGST,
        paid: !!inv.paymentReceivedMonth,
        currency: inv.currency,
      });
    });

    return Object.values(map).sort((a, b) => {
      // Sort by fiscal year desc then by month within FY
      if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear.localeCompare(a.fiscalYear);
      return monthSortKey(b.month) - monthSortKey(a.month);
    });
  }, [invoices, filterFY]);

  const totals = useMemo(() => ({
    gstableRevenue: monthlyData.reduce((s, r) => s + r.gstableRevenue, 0),
    gstCollected: monthlyData.reduce((s, r) => s + r.gstCollected, 0),
    paidGST: monthlyData.reduce((s, r) => s + r.paidGST, 0),
    pendingGST: monthlyData.reduce((s, r) => s + r.pendingGST, 0),
    totalBillingSGD: monthlyData.reduce((s, r) => s + r.totalBillingSGD, 0),
  }), [monthlyData]);

  function exportCSV() {
    const lines: string[] = [];
    lines.push("ENFACTUM — GST REPORT");
    lines.push(`Filter: ${filterFY}`);
    lines.push("");
    lines.push("Month,Fiscal Year,# Invoices,GST-able Revenue (SGD),GST Collected (9%),Non-GST Revenue,Total Billing SGD,GST Received,GST Pending");
    monthlyData.forEach(r => {
      lines.push([
        r.month, r.fiscalYear, r.invoiceCount,
        r.gstableRevenue.toFixed(2), r.gstCollected.toFixed(2),
        r.nonGstRevenue.toFixed(2), r.totalBillingSGD.toFixed(2),
        r.paidGST.toFixed(2), r.pendingGST.toFixed(2),
      ].join(","));
    });
    lines.push(["TOTAL", "", monthlyData.reduce((s,r)=>s+r.invoiceCount,0),
      totals.gstableRevenue.toFixed(2), totals.gstCollected.toFixed(2),
      "", totals.totalBillingSGD.toFixed(2), totals.paidGST.toFixed(2), totals.pendingGST.toFixed(2),
    ].join(","));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Enfactum_GST_Report_${filterFY}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fmt(n: number) {
    return `S$${n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>GST Report</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Monthly GST collected &amp; payable · 9% GST rate (Singapore)
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterFY}
            onChange={e => setFilterFY(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)", color: "hsl(var(--foreground))" }}
          >
            {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-glass">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--primary))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Total GST Collected</div>
          <div className="mono text-xl font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>{fmt(totals.gstCollected)}</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>on {fmt(totals.gstableRevenue)} ex-tax</div>
        </div>

        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--positive))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>GST Received</div>
          <div className="mono text-xl font-bold mb-1" style={{ color: "hsl(var(--positive))" }}>{fmt(totals.paidGST)}</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>from paid invoices</div>
        </div>

        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--warning))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>GST Pending</div>
          <div className="mono text-xl font-bold mb-1" style={{ color: "hsl(var(--warning))" }}>{fmt(totals.pendingGST)}</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>from unpaid invoices</div>
        </div>

        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--muted-foreground))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Total Billing (SGD)</div>
          <div className="mono text-xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>{fmt(totals.totalBillingSGD)}</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>incl. GST where applicable</div>
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl border text-xs" style={{ background: "hsl(var(--warning) / 0.07)", borderColor: "hsl(var(--warning) / 0.25)", color: "hsl(var(--muted-foreground))" }}>
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--warning))" }} />
        <span>
          GST shown is collected on behalf of IRAS and must be remitted quarterly. Only SGD invoices with GST flag attract 9% GST.
          USD invoices are outside the scope of Singapore GST unless specifically flagged.
        </span>
      </div>

      {/* Monthly table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)", boxShadow: "var(--shadow-md)" }}>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>FY</th>
                <th className="text-right"># Invoices</th>
                <th className="text-right">Ex-Tax Revenue (SGD)</th>
                <th className="text-right">GST Collected (9%)</th>
                <th className="text-right">GST Received</th>
                <th className="text-right">GST Pending</th>
                <th className="text-right">Total Billed (SGD)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(row => {
                const isExpanded = expandedMonth === row.month;
                const hasPending = row.pendingGST > 0;
                return (
                  <>
                    <tr
                      key={row.month}
                      className={cn("cursor-pointer transition-colors hover:bg-[hsl(var(--surface-3))]", isExpanded && "bg-[hsl(var(--surface-3))]")}
                      onClick={() => setExpandedMonth(isExpanded ? null : row.month)}
                    >
                      <td>
                        <span className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{row.month}</span>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--muted-foreground))" }}>{row.fiscalYear}</span>
                      </td>
                      <td className="text-right">
                        <span className="mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{row.invoiceCount}</span>
                      </td>
                      <td className="text-right">
                        <span className="mono text-sm" style={{ color: "hsl(var(--foreground))" }}>{fmt(row.gstableRevenue + row.nonGstRevenue)}</span>
                      </td>
                      <td className="text-right">
                        {row.gstCollected > 0
                          ? <span className="mono text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>{fmt(row.gstCollected)}</span>
                          : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                        }
                      </td>
                      <td className="text-right">
                        {row.paidGST > 0
                          ? <span className="mono text-sm" style={{ color: "hsl(var(--positive))" }}>{fmt(row.paidGST)}</span>
                          : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                        }
                      </td>
                      <td className="text-right">
                        {hasPending
                          ? <span className="mono text-sm font-semibold badge-warning">{fmt(row.pendingGST)}</span>
                          : row.gstCollected > 0
                            ? <span className="badge-positive text-xs">All received</span>
                            : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                        }
                      </td>
                      <td className="text-right">
                        <span className="mono text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{fmt(row.totalBillingSGD)}</span>
                      </td>
                      <td>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded invoice detail */}
                    {isExpanded && (
                      <tr key={`${row.month}-detail`}>
                        <td colSpan={9} className="p-0">
                          <div className="px-4 py-3 border-t" style={{ background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))" }}>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                              Invoice Breakdown — {row.month}
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
                                  <th className="text-left pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Invoice #</th>
                                  <th className="text-left pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Company</th>
                                  <th className="text-left pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Account</th>
                                  <th className="text-left pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Cur</th>
                                  <th className="text-right pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Ex-Tax (SGD)</th>
                                  <th className="text-right pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>GST (9%)</th>
                                  <th className="text-right pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Total (SGD)</th>
                                  <th className="text-center pb-1.5 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.invoices.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber)).map(inv => (
                                  <tr key={inv.invoiceNumber} className="border-b last:border-0" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
                                    <td className="py-1.5 mono font-medium" style={{ color: "hsl(var(--primary))" }}>{inv.invoiceNumber}</td>
                                    <td className="py-1.5 max-w-[200px] truncate" style={{ color: "hsl(var(--foreground))" }}>{inv.company}</td>
                                    <td className="py-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.account}</td>
                                    <td className="py-1.5 font-semibold mono" style={{ color: inv.currency === "USD" ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))" }}>{inv.currency}</td>
                                    <td className="py-1.5 text-right mono" style={{ color: "hsl(var(--foreground))" }}>{fmt(inv.exTaxSGD)}</td>
                                    <td className="py-1.5 text-right mono">
                                      {inv.hasGST
                                        ? <span style={{ color: "hsl(var(--primary))" }}>{fmt(inv.gstAmount)}</span>
                                        : <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                                      }
                                    </td>
                                    <td className="py-1.5 text-right mono font-semibold" style={{ color: "hsl(var(--foreground))" }}>{fmt(inv.totalSGD)}</td>
                                    <td className="py-1.5 text-center">
                                      {inv.paid
                                        ? <span className="badge-positive">Paid</span>
                                        : <span className="badge-warning">Pending</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            {monthlyData.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--surface-3))" }}>
                    TOTAL ({monthlyData.length} months)
                  </td>
                  <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--foreground))", background: "hsl(var(--surface-3))" }}>
                    {fmt(totals.gstableRevenue + monthlyData.reduce((s,r)=>s+r.nonGstRevenue,0))}
                  </td>
                  <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--primary))", background: "hsl(var(--surface-3))" }}>
                    {fmt(totals.gstCollected)}
                  </td>
                  <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--positive))", background: "hsl(var(--surface-3))" }}>
                    {fmt(totals.paidGST)}
                  </td>
                  <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--warning))", background: "hsl(var(--surface-3))" }}>
                    {fmt(totals.pendingGST)}
                  </td>
                  <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--foreground))", background: "hsl(var(--surface-3))" }}>
                    {fmt(totals.totalBillingSGD)}
                  </td>
                  <td style={{ background: "hsl(var(--surface-3))" }} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
