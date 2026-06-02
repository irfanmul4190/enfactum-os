import { useState, useMemo } from "react";
import { Search, Filter, Download, ChevronUp, ChevronDown, Plus, AlertTriangle } from "lucide-react";
import { Invoice } from "@/data/invoiceData";
import { AddInvoiceDialog } from "@/components/AddInvoiceDialog";
import { OverdueTab } from "@/components/OverdueTab";
import { getOverdueInvoices, TODAY } from "@/lib/overdueUtils";
import { usePaymentTerms } from "@/contexts/PaymentTermsContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── CSV Export ────────────────────────────────────────────────────────────────
function escapeCell(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(",");
}

function exportInvoicesCSV(invoices: Invoice[], filterLabel: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
  const totalSGD = invoices.reduce((s, i) => s + i.totalBillingSGD, 0);
  const totalExTax = invoices.reduce((s, i) => {
    const ex = i.currency === "SGD" ? (i.amountSGDExTax ?? 0) : ((i.amountUSDExTax ?? 0) * 1.30);
    return s + ex;
  }, 0);
  const totalGST = totalSGD - totalExTax;

  // By account
  const byAccount: Record<string, number> = {};
  invoices.forEach(i => { byAccount[i.account] = (byAccount[i.account] ?? 0) + i.totalBillingSGD; });
  const accountEntries = Object.entries(byAccount).sort((a, b) => b[1] - a[1]);

  // By lead
  const byLead: Record<string, number> = {};
  invoices.forEach(i => { byLead[i.accountLead] = (byLead[i.accountLead] ?? 0) + i.totalBillingSGD; });
  const leadEntries = Object.entries(byLead).sort((a, b) => b[1] - a[1]);

  // Payment status
  const paid = invoices.filter(i => i.paymentReceivedMonth).length;
  const pending = invoices.length - paid;

  const lines: string[] = [];

  // ── Header ──
  lines.push(row("ENFACTUM — INVOICE EXPORT REPORT"));
  lines.push(row("Generated", dateStr));
  lines.push(row("Filter", filterLabel || "All Invoices"));
  lines.push(row("Total Invoices", invoices.length));
  lines.push("");

  // ── Revenue Summary ──
  lines.push(row("REVENUE SUMMARY"));
  lines.push(row("Metric", "SGD"));
  lines.push(row("Total Billing (SGD)", totalSGD.toFixed(2)));
  lines.push(row("Estimated Ex-Tax Revenue", totalExTax.toFixed(2)));
  lines.push(row("Estimated GST Collected", Math.max(0, totalGST).toFixed(2)));
  lines.push(row("Invoices Paid", paid));
  lines.push(row("Invoices Pending Payment", pending));
  lines.push("");

  // ── Revenue by Account ──
  lines.push(row("REVENUE BY ACCOUNT"));
  lines.push(row("Account", "Total SGD", "% of Total", "Invoice Count"));
  accountEntries.forEach(([account, amt]) => {
    const count = invoices.filter(i => i.account === account).length;
    const pct = totalSGD > 0 ? ((amt / totalSGD) * 100).toFixed(1) + "%" : "0%";
    lines.push(row(account, amt.toFixed(2), pct, count));
  });
  lines.push(row("TOTAL", totalSGD.toFixed(2), "100%", invoices.length));
  lines.push("");

  // ── Revenue by Account Lead ──
  lines.push(row("REVENUE BY ACCOUNT LEAD"));
  lines.push(row("Lead", "Total SGD", "% of Total", "Invoice Count"));
  leadEntries.forEach(([lead, amt]) => {
    const count = invoices.filter(i => i.accountLead === lead).length;
    const pct = totalSGD > 0 ? ((amt / totalSGD) * 100).toFixed(1) + "%" : "0%";
    lines.push(row(lead, amt.toFixed(2), pct, count));
  });
  lines.push(row("TOTAL", totalSGD.toFixed(2), "100%", invoices.length));
  lines.push("");

  // ── Invoice Detail ──
  lines.push(row("INVOICE DETAIL"));
  lines.push(row(
    "Invoice #", "Date", "Month", "Fiscal Year",
    "Company", "Billed To", "Account", "Lead", "Country",
    "Currency", "Amount Ex-Tax", "GST?", "Amount With Tax (Orig Currency)",
    "Total Billing SGD", "Payment Received", "Remarks"
  ));
  invoices.forEach(inv => {
    const exTax = inv.currency === "SGD" ? (inv.amountSGDExTax ?? 0) : (inv.amountUSDExTax ?? 0);
    const withTax = inv.currency === "SGD" ? (inv.amountSGDWithTax ?? 0) : (inv.amountUSDWithTax ?? 0);
    lines.push(row(
      inv.invoiceNumber, inv.date, inv.month, inv.fiscalYear,
      inv.company, inv.billedTo, inv.account, inv.accountLead, inv.country ?? "Singapore",
      inv.currency, exTax.toFixed(2), inv.hasGST ? "Yes" : "No", withTax.toFixed(2),
      inv.totalBillingSGD.toFixed(2), inv.paymentReceivedMonth ?? "Pending", inv.remarks || ""
    ));
  });
  lines.push("");
  lines.push(row("", "", "", "", "", "", "", "", "", "", "", "", totalSGD.toFixed(2)));

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = filterLabel.replace(/\s+/g, "_") || "All";
  a.href = url;
  a.download = `Enfactum_Invoices_${slug}_${now.getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}



type SortField = "date" | "invoiceNumber" | "company" | "totalBillingSGD";
type SortDir = "asc" | "desc";
type Tab = "all" | "overdue";

const MONTHS = ["All",
  "Jan-24", "Feb-24", "Mar-24",
  "Jan-25", "Feb-25", "Mar-25",
  "Apr-25", "May-25", "Jun-25", "Jul-25", "Aug-25", "Sep-25",
  "Oct-25", "Nov-25", "Dec-25",
  "Jan-26", "Feb-26", "Mar-26",
];
const ACCOUNTS_FILTER = ["All", "HP", "IT CAN", "Oracle", "EbaoTech", "BFL", "Impact", "Loreal", "CellLife", "Castrol", "Lenovo", "SD Guthrie", "AICB", "Equinamity", "Fuji", "Vizzio Technologies", "Jon Lee", "Adani", "Economist"];
const LEADS_FILTER = ["All", "Pooja", "William", "Sandeep", "Sanjay C", "Irfan", "Eve"];
const COUNTRIES_FILTER = ["All", "Singapore", "Malaysia", "India", "Indonesia", "Others"];

export function InvoiceTracker({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { terms } = usePaymentTerms();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState("All");
  const [selectedLead, setSelectedLead] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState<number | null>(null);

  const existingNumbers = invoices.map(i => i.invoiceNumber.toUpperCase());
  const nextId = Math.max(...invoices.map(i => i.id), 0) + 1;

  // Overdue count for badge
  const overdueCount = useMemo(
    () => getOverdueInvoices(invoices, TODAY, terms).filter(o => !o.paymentReceivedMonth).length,
    [invoices, terms]
  );

  async function handleAdd(invoice: Invoice) {
    try {
      const saved = await addInvoice(invoice);
      setNewlyAdded(saved.id);
      setTimeout(() => setNewlyAdded(null), 3000);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the invoice.");
    }
  }

  async function handleSave(updated: Invoice) {
    try {
      await updateInvoice(updated);
      setNewlyAdded(updated.id);
      setTimeout(() => setNewlyAdded(null), 3000);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update the invoice.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteInvoice(id);
      handleClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete the invoice.");
    }
  }

  function openEdit(inv: Invoice) {
    setEditingInvoice(inv);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
    setEditingInvoice(null);
  }

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (selectedMonth !== "All" && inv.month !== selectedMonth) return false;
      if (selectedAccount !== "All" && inv.account !== selectedAccount) return false;
      if (selectedLead !== "All" && inv.accountLead !== selectedLead) return false;
      if (selectedCountry !== "All" && (inv.country ?? "Singapore") !== selectedCountry) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.invoiceNumber.toLowerCase().includes(q)
          || inv.company.toLowerCase().includes(q)
          || inv.billedTo.toLowerCase().includes(q)
          || inv.remarks.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "date") return (a.date > b.date ? 1 : -1) * dir;
      if (sortField === "totalBillingSGD") return (a.totalBillingSGD - b.totalBillingSGD) * dir;
      if (sortField === "company") return a.company.localeCompare(b.company) * dir;
      return a.invoiceNumber.localeCompare(b.invoiceNumber) * dir;
    });
  }, [invoices, search, selectedMonth, selectedAccount, selectedLead, selectedCountry, sortField, sortDir]);

  const totalSGD = filtered.reduce((s, i) => s + i.totalBillingSGD, 0);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
      : <ChevronDown className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />;
  }

  return (
    <>
      <AddInvoiceDialog
        open={dialogOpen}
        onClose={handleClose}
        onAdd={handleAdd}
        onSave={handleSave}
        onDelete={handleDelete}
        editInvoice={editingInvoice}
        nextId={nextId}
        existingNumbers={existingNumbers}
      />

      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Invoice Tracker</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {invoices.length} total invoices · As of {TODAY.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        <div className="flex gap-2">
            <button
              onClick={() => {
                const parts: string[] = [];
                if (selectedMonth !== "All") parts.push(selectedMonth);
                if (selectedAccount !== "All") parts.push(selectedAccount);
                if (selectedLead !== "All") parts.push(selectedLead);
                if (search) parts.push(search);
                exportInvoicesCSV(filtered, parts.join(" · ") || "All");
              }}
              className="btn-glass"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => onNavigate ? onNavigate("entry") : setDialogOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add Invoice
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "var(--glass-blur)" }}>
          <button
            onClick={() => setActiveTab("all")}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150")}
            style={activeTab === "all"
              ? { background: "var(--gradient-glass)", color: "hsl(var(--foreground))", boxShadow: "var(--shadow-sm)", border: "1px solid var(--glass-border)" }
              : { color: "hsl(var(--muted-foreground))" }
            }
          >
            All Invoices
            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--muted-foreground))" }}>
              {invoices.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("overdue")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150")}
            style={activeTab === "overdue"
              ? { background: "hsl(var(--negative) / 0.12)", color: "hsl(var(--negative))", boxShadow: "var(--shadow-sm)", border: "1px solid hsl(var(--negative) / 0.25)" }
              : { color: "hsl(var(--muted-foreground))" }
            }
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(var(--negative))", color: "white" }}>
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "overdue" ? (
          <OverdueTab invoices={invoices} />
        ) : (
          <>
            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search invoice, company, contact…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-150 focus:ring-1"
                    style={{
                      background: "var(--glass-bg)",
                      borderColor: "var(--glass-border)",
                      backdropFilter: "var(--glass-blur)",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(f => !f)}
                  className="btn-glass"
                  style={showFilters ? { background: "var(--glass-btn-hover)", boxShadow: `0 0 0 1px hsl(var(--primary) / 0.3)` } : {}}
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-4 gap-3 p-4 rounded-lg border" style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))" }}>
                  {[
                    { label: "Month", value: selectedMonth, set: setSelectedMonth, opts: MONTHS },
                    { label: "Account", value: selectedAccount, set: setSelectedAccount, opts: ACCOUNTS_FILTER },
                    { label: "Account Lead", value: selectedLead, set: setSelectedLead, opts: LEADS_FILTER },
                    { label: "Country", value: selectedCountry, set: setSelectedCountry, opts: COUNTRIES_FILTER },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--muted-foreground))" }}>{f.label}</label>
                      <select value={f.value} onChange={e => f.set(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Showing {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} · SGD {totalSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)", boxShadow: "var(--shadow-md)" }}>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th><button onClick={() => toggleSort("invoiceNumber")} className="flex items-center gap-1">Invoice # <SortIcon field="invoiceNumber" /></button></th>
                      <th><button onClick={() => toggleSort("company")} className="flex items-center gap-1">Company <SortIcon field="company" /></button></th>
                      <th>Billed To</th>
                      <th><button onClick={() => toggleSort("date")} className="flex items-center gap-1">Date <SortIcon field="date" /></button></th>
                      <th>Account</th>
                      <th>Lead</th>
                      <th>Country</th>
                      <th>Cur</th>
                      <th><button onClick={() => toggleSort("totalBillingSGD")} className="flex items-center gap-1">Ex-Tax (SGD) <SortIcon field="totalBillingSGD" /></button></th>
                      <th>GST (9%)</th>
                      <th>Total (SGD)</th>
                      <th>Payment</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => {
                      const isNew = inv.id === newlyAdded;
                      return (
                        <tr
                          key={inv.id}
                          onClick={() => openEdit(inv)}
                          className="cursor-pointer transition-colors hover:bg-[hsl(var(--surface-3))]"
                          style={isNew ? { background: "hsl(var(--positive-muted))", transition: "background 2s ease" } : {}}
                          title="Click to edit"
                        >
                          <td><span className="mono text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>{inv.invoiceNumber}</span></td>
                          <td><div className="font-medium text-sm max-w-[180px] truncate" style={{ color: "hsl(var(--foreground))" }} title={inv.company}>{inv.company}</div></td>
                          <td><div className="text-sm max-w-[160px] truncate" style={{ color: "hsl(var(--muted-foreground))" }} title={inv.billedTo}>{inv.billedTo}</div></td>
                          <td><span className="mono text-xs">{inv.date}</span></td>
                          <td><span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--foreground))" }}>{inv.account}</span></td>
                          <td><span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.accountLead}</span></td>
                          <td><span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{inv.country ?? "Singapore"}</span></td>
                          <td><span className={cn("text-xs font-semibold mono", inv.currency === "USD" ? "stat-warning" : "")}>{inv.currency}</span></td>
                          <td>
                            {(() => {
                              const exTax = inv.currency === "SGD"
                                ? (inv.amountSGDExTax ?? inv.totalBillingSGD)
                                : inv.hasGST
                                  ? inv.totalBillingSGD / 1.09
                                  : inv.totalBillingSGD;
                              return <span className="mono text-sm" style={{ color: "hsl(var(--foreground))" }}>S${exTax.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>;
                            })()}
                          </td>
                          <td>
                            {inv.hasGST ? (() => {
                              const exTax = inv.currency === "SGD"
                                ? (inv.amountSGDExTax ?? inv.totalBillingSGD / 1.09)
                                : inv.totalBillingSGD / 1.09;
                              const gst = inv.totalBillingSGD - exTax;
                              return <span className="mono text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>S${gst.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>;
                            })() : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>}
                          </td>
                          <td><span className="mono text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{inv.totalBillingSGD > 0 ? `S$${inv.totalBillingSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—"}</span></td>
                          <td>{inv.paymentReceivedMonth ? <span className="badge-positive">{inv.paymentReceivedMonth}</span> : <span className="badge-warning">Pending</span>}</td>
                          <td>{inv.remarks ? <span className={cn("text-xs", inv.remarks.toLowerCase().includes("credit") ? "badge-negative" : "badge-warning")}>{inv.remarks}</span> : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>}</td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={12} className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>No invoices match your filters.</td></tr>
                    )}
                  </tbody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <tr>
                      <td colSpan={8} className="px-4 py-3 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--surface-3))" }}>TOTAL ({filtered.length} invoices)</td>
                        <td className="px-4 py-3 mono text-sm text-right" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--surface-3))" }}>
                          {(() => {
                            const exTaxTotal = filtered.reduce((s, inv) => {
                              const ex = inv.currency === "SGD"
                                ? (inv.amountSGDExTax ?? inv.totalBillingSGD)
                                : inv.hasGST ? inv.totalBillingSGD / 1.09 : inv.totalBillingSGD;
                              return s + ex;
                            }, 0);
                            return `S$${exTaxTotal.toLocaleString("en-SG", { minimumFractionDigits: 2 })}`;
                          })()}
                        </td>
                        <td className="px-4 py-3 mono text-sm font-semibold text-right" style={{ color: "hsl(var(--primary))", background: "hsl(var(--surface-3))" }}>
                          {(() => {
                            const gstTotal = filtered.reduce((s, inv) => {
                              if (!inv.hasGST) return s;
                              const ex = inv.currency === "SGD"
                                ? (inv.amountSGDExTax ?? inv.totalBillingSGD / 1.09)
                                : inv.totalBillingSGD / 1.09;
                              return s + (inv.totalBillingSGD - ex);
                            }, 0);
                            return gstTotal > 0 ? `S$${gstTotal.toLocaleString("en-SG", { minimumFractionDigits: 2 })}` : "—";
                          })()}
                        </td>
                        <td className="px-4 py-3 mono font-bold text-sm text-right" style={{ color: "hsl(var(--foreground))", background: "hsl(var(--surface-3))" }}>S${totalSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</td>
                        <td colSpan={2} style={{ background: "hsl(var(--surface-3))" }} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
