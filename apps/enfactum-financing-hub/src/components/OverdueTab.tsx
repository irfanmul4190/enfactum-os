import { useMemo, useState } from "react";
import { AlertTriangle, Clock, TrendingDown, CheckCircle, Bell, BellOff, X, MessageSquare } from "lucide-react";
import { Invoice } from "@/data/invoiceData";
import { getOverdueInvoices, BUCKET_CONFIG, TODAY, AgingBucket, OverdueInvoice } from "@/lib/overdueUtils";
import { usePaymentTerms } from "@/contexts/PaymentTermsContext";
import { useChase, ChaseRecord } from "@/contexts/ChaseContext";
import { cn } from "@/lib/utils";

interface OverdueTabProps {
  invoices: Invoice[];
}

const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", "90+"];
const FOLLOWUP_OPTIONS = [3, 5, 7, 14];

function AgeBadge({ days, bucket }: { days: number; bucket: AgingBucket }) {
  const cfg = BUCKET_CONFIG[bucket];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Clock className="w-3 h-3" />
      {days}d overdue
    </span>
  );
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date(TODAY);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

interface ChaseDialogProps {
  inv: OverdueInvoice;
  existing?: ChaseRecord;
  onSave: (record: ChaseRecord) => void;
  onClear: () => void;
  onClose: () => void;
}

function ChaseDialog({ inv, existing, onSave, onClear, onClose }: ChaseDialogProps) {
  const today = TODAY.toISOString().slice(0, 10);
  const [chasedOn, setChasedOn] = useState(existing?.chasedOn ?? today);
  const [followUpDays, setFollowUpDays] = useState(existing?.followUpDays ?? 7);
  const [note, setNote] = useState(existing?.note ?? "");

  const followUpDate = addDaysToDate(chasedOn, followUpDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="rounded-2xl border w-[420px] shadow-2xl"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>Chase Invoice</span>
            </div>
            <div className="mono text-xs" style={{ color: "hsl(var(--primary))" }}>{inv.invoiceNumber}</div>
            <div className="text-xs mt-0.5 truncate max-w-[300px]" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.company}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-secondary">
            <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* Amount callout */}
        <div className="mx-5 mt-4 p-3 rounded-xl flex items-center justify-between" style={{ background: "hsl(var(--negative) / 0.08)", border: "1px solid hsl(var(--negative) / 0.2)" }}>
          <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Outstanding Amount</span>
          <span className="mono text-sm font-bold" style={{ color: "hsl(var(--negative))" }}>
            S${inv.totalBillingSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Chased On */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Date Chased
            </label>
            <input
              type="date"
              value={chasedOn}
              onChange={e => setChasedOn(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          {/* Follow-up in */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Follow Up In
            </label>
            <div className="flex gap-2">
              {FOLLOWUP_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFollowUpDays(d)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={followUpDays === d
                    ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }
                    : { background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                  }
                >
                  {d}d
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--primary))" }}>
              <Bell className="w-3 h-3" />
              Follow up by <strong className="ml-1">{followUpDate}</strong>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              Note <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Spoke to finance team, awaiting approval…"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              maxLength={200}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {existing && (
              <button
                onClick={() => { onClear(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-secondary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                <BellOff className="w-3.5 h-3.5" /> Clear Chase
              </button>
            )}
            <button
              onClick={() => {
                onSave({ invoiceId: inv.id, chasedOn, followUpDays, note });
                onClose();
              }}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            >
              {existing ? "Update Chase" : "Mark as Chased"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OverdueTab({ invoices }: OverdueTabProps) {
  const { terms } = usePaymentTerms();
  const { chaseRecords, addChase, clearChase } = useChase();
  const [chaseDialogInv, setChaseDialogInv] = useState<OverdueInvoice | null>(null);

  const overdue = useMemo(() => getOverdueInvoices(invoices, TODAY, terms), [invoices, terms]);

  const totalOutstanding = overdue
    .filter(o => !o.paymentReceivedMonth)
    .reduce((s, o) => s + o.totalBillingSGD, 0);

  const totalLate = overdue
    .filter(o => o.paymentReceivedMonth)
    .reduce((s, o) => s + o.totalBillingSGD, 0);

  const unpaid = overdue.filter(o => !o.paymentReceivedMonth);
  const lateButPaid = overdue.filter(o => o.paymentReceivedMonth);

  const byBucket = BUCKETS.reduce<Record<AgingBucket, OverdueInvoice[]>>((acc, b) => {
    acc[b] = overdue.filter(o => o.agingBucket === b && !o.paymentReceivedMonth);
    return acc;
  }, {} as Record<AgingBucket, OverdueInvoice[]>);

  const byBucketValue = BUCKETS.reduce<Record<AgingBucket, number>>((acc, b) => {
    acc[b] = byBucket[b].reduce((s, o) => s + o.totalBillingSGD, 0);
    return acc;
  }, {} as Record<AgingBucket, number>);

  const chasedCount = unpaid.filter(o => chaseRecords[o.id]).length;
  const overdueCount = unpaid.filter(o => !chaseRecords[o.id]).length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Chase dialog */}
      {chaseDialogInv && (
        <ChaseDialog
          inv={chaseDialogInv}
          existing={chaseRecords[chaseDialogInv.id]}
          onSave={addChase}
          onClear={() => clearChase(chaseDialogInv.id)}
          onClose={() => setChaseDialogInv(null)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--negative))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Unpaid Overdue</div>
          <div className="mono text-2xl font-bold mb-1" style={{ color: "hsl(var(--negative))" }}>
            {unpaid.length}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>invoices outstanding</div>
          <div className="mt-2 mono text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            SGD {totalOutstanding.toLocaleString("en-SG", { maximumFractionDigits: 0 })}
          </div>
        </div>

        {BUCKETS.slice(0, 3).map(bucket => {
          const cfg = BUCKET_CONFIG[bucket];
          const count = byBucket[bucket].length;
          const val = byBucketValue[bucket];
          return (
            <div key={bucket} className="kpi-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: cfg.color }} />
              <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{cfg.label} overdue</div>
              <div className="mono text-2xl font-bold mb-1" style={{ color: cfg.color }}>{count}</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>invoices</div>
              {val > 0 && (
                <div className="mt-2 mono text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  SGD {val.toLocaleString("en-SG", { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aging Breakdown Banner */}
      {unpaid.length > 0 && totalOutstanding > 0 && (
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Aging Analysis — Unpaid Invoices</h3>
            <span className="text-xs mono font-bold" style={{ color: "hsl(var(--negative))" }}>
              SGD {totalOutstanding.toLocaleString("en-SG", { maximumFractionDigits: 0 })} total at risk
            </span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden mb-3 gap-0.5">
            {BUCKETS.map(b => {
              const pct = totalOutstanding > 0 ? (byBucketValue[b] / totalOutstanding) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={b}
                  className="h-full transition-all"
                  style={{ width: `${pct}%`, background: BUCKET_CONFIG[b].color, minWidth: pct > 0 ? "4px" : "0" }}
                  title={`${BUCKET_CONFIG[b].label}: SGD ${byBucketValue[b].toLocaleString("en-SG", { maximumFractionDigits: 0 })}`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {BUCKETS.map(b => {
              const pct = totalOutstanding > 0 ? (byBucketValue[b] / totalOutstanding) * 100 : 0;
              const cfg = BUCKET_CONFIG[b];
              return (
                <div key={b} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{cfg.label}</span>
                  </div>
                  <div className="mono text-sm font-bold" style={{ color: cfg.color }}>{pct.toFixed(0)}%</div>
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {byBucket[b].length} inv · SGD {(byBucketValue[b] / 1000).toFixed(0)}K
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unpaid Overdue Table */}
      {unpaid.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--negative))" }} />
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Unpaid Overdue Invoices ({unpaid.length})
              </h3>
            </div>
            {chasedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                <Bell className="w-3 h-3" />
                {chasedCount} chased · {overdueCount} not yet chased
              </div>
            )}
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--negative) / 0.3)" }}>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Company</th>
                    <th>Account</th>
                    <th>Lead</th>
                    <th>Due Date</th>
                    <th>Amount (SGD)</th>
                    <th>Days Overdue</th>
                    <th>Chase Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaid.map(inv => {
                    const cfg = BUCKET_CONFIG[inv.agingBucket];
                    const chase = chaseRecords[inv.id];
                    const followUpDaysLeft = chase ? daysUntil(
                      (() => { const d = new Date(chase.chasedOn); d.setDate(d.getDate() + chase.followUpDays); return d.toISOString().slice(0, 10); })()
                    ) : null;
                    const isOverdue = followUpDaysLeft !== null && followUpDaysLeft <= 0;
                    const isDueSoon = followUpDaysLeft !== null && followUpDaysLeft > 0 && followUpDaysLeft <= 2;

                    return (
                      <tr key={inv.id} style={{ borderLeft: `3px solid ${cfg.color}` }}>
                        <td>
                          <span className="mono text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>{inv.invoiceNumber}</span>
                        </td>
                        <td>
                          <div className="font-medium text-sm max-w-[160px] truncate" style={{ color: "hsl(var(--foreground))" }} title={inv.company}>{inv.company}</div>
                          <div className="text-xs truncate max-w-[160px]" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.billedTo}</div>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--foreground))" }}>{inv.account}</span>
                        </td>
                        <td><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.accountLead}</span></td>
                        <td>
                          <span className="mono text-xs" style={{ color: "hsl(var(--negative))" }}>
                            {inv.dueDate.toISOString().slice(0, 10)}
                          </span>
                        </td>
                        <td>
                          <span className="mono text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                            S${inv.totalBillingSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <AgeBadge days={inv.daysOutstanding} bucket={inv.agingBucket} />
                        </td>
                        <td>
                          {chase ? (
                            <div className="space-y-1">
                              {/* Follow-up status */}
                              <div
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={
                                  isOverdue
                                    ? { background: "hsl(var(--negative) / 0.15)", color: "hsl(var(--negative))" }
                                    : isDueSoon
                                    ? { background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))" }
                                    : { background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }
                                }
                              >
                                <Bell className="w-3 h-3" />
                                {isOverdue
                                  ? `Follow up overdue!`
                                  : `Follow up in ${followUpDaysLeft}d`
                                }
                              </div>
                              {/* Chased on date */}
                              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                                Chased {new Date(chase.chasedOn).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                              </div>
                              {chase.note && (
                                <div className="flex items-start gap-1 text-xs max-w-[180px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                                  <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span className="truncate" title={chase.note}>{chase.note}</span>
                                </div>
                              )}
                              <button
                                onClick={() => setChaseDialogInv(inv)}
                                className="text-xs underline transition-opacity hover:opacity-70"
                                style={{ color: "hsl(var(--primary))" }}
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setChaseDialogInv(inv)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
                            >
                              <Bell className="w-3 h-3" /> Chase →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--surface-3))" }}>
                      TOTAL OUTSTANDING ({unpaid.length} invoices)
                    </td>
                    <td className="px-4 py-3 mono font-bold text-sm" style={{ color: "hsl(var(--negative))", background: "hsl(var(--surface-3))" }}>
                      S${totalOutstanding.toLocaleString("en-SG", { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} style={{ background: "hsl(var(--surface-3))" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-10 text-center" style={{ background: "hsl(var(--positive-muted))", borderColor: "hsl(var(--positive) / 0.3)" }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--positive))" }} />
          <div className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--positive))" }}>All caught up!</div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>No unpaid overdue invoices — great payment collection.</div>
        </div>
      )}

      {/* Late but Paid */}
      {lateButPaid.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4" style={{ color: "hsl(var(--warning))" }} />
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Paid Late — Historical ({lateButPaid.length})
            </h3>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>These were paid but exceeded the 30-day term</span>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--warning) / 0.3)" }}>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Company</th>
                    <th>Account</th>
                    <th>Lead</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Amount (SGD)</th>
                    <th>Paid Month</th>
                    <th>Late By</th>
                  </tr>
                </thead>
                <tbody>
                  {lateButPaid.map(inv => (
                    <tr key={inv.id}>
                      <td><span className="mono text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>{inv.invoiceNumber}</span></td>
                      <td>
                        <div className="font-medium text-sm max-w-[180px] truncate" style={{ color: "hsl(var(--foreground))" }}>{inv.company}</div>
                        <div className="text-xs truncate max-w-[180px]" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.billedTo}</div>
                      </td>
                      <td><span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--foreground))" }}>{inv.account}</span></td>
                      <td><span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.accountLead}</span></td>
                      <td><span className="mono text-xs">{inv.date}</span></td>
                      <td><span className="mono text-xs">{inv.dueDate.toISOString().slice(0, 10)}</span></td>
                      <td><span className="mono text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>S${inv.totalBillingSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span></td>
                      <td><span className="badge-positive">{inv.paymentReceivedMonth}</span></td>
                      <td>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))" }}>
                          <Clock className="w-3 h-3" />{inv.daysOutstanding}d late
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary advice */}
      <div className="rounded-xl border p-4" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>📋 Collections Best Practice</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { bucket: "0-30" as AgingBucket, action: "Send a polite payment reminder email with the invoice copy attached." },
            { bucket: "31-60" as AgingBucket, action: "Follow up by phone. Escalate to account lead. Confirm invoice was received." },
            { bucket: "90+" as AgingBucket,  action: "Issue formal demand letter. Consider credit hold on new orders." },
          ].map(({ bucket, action }) => {
            const cfg = BUCKET_CONFIG[bucket];
            return (
              <div key={bucket} className="rounded-lg p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="text-xs font-bold mb-1" style={{ color: cfg.color }}>{cfg.label} overdue</div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{action}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
