import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { formatNumber } from "@/data/invoiceData";
import type { Invoice } from "@/data/invoiceData";
import { useInvoices } from "@/contexts/InvoiceContext";

// Static per-lead metadata — FY24 history and the FY25 account list. FY25
// revenue and share of total are computed live from the invoices table.
interface LeadMeta {
  name: string;
  initials: string;
  color: string;
  fy24: { revenue: number; pct: number; accounts: string[] };
  fy25Accounts: string[];
  highlights: string[];
}

interface Lead extends LeadMeta {
  fy25: { revenue: number; pct: number; accounts: string[] };
}

const LEAD_META: LeadMeta[] = [
  {
    name: "Pooja",
    initials: "P",
    color: "hsl(var(--chart-1))",
    fy24: { revenue: 2487240, pct: 69.1, accounts: ["HP", "IT CAN", "Oracle", "Fuji", "Economist"] },
    fy25Accounts: ["HP", "IT CAN", "Oracle", "Fuji"],
    highlights: ["Manages HP — largest single account", "Driving IT CAN growth +163.9% YoY", "Fuji ongoing engagement"],
  },
  {
    name: "William",
    initials: "W",
    color: "hsl(var(--chart-2))",
    fy24: { revenue: 398520, pct: 11.1, accounts: ["BFL", "Impact", "Jon Lee", "Vizzio Technologies", "Adani"] },
    fy25Accounts: ["BFL", "Impact", "Loreal", "CellLife", "Jon Lee", "Vizzio Technologies", "Adani"],
    highlights: ["Loreal & CellLife new additions", "BFL steady recurring revenue", "Jon Lee, Vizzio, Adani ongoing"],
  },
  {
    name: "Sandeep",
    initials: "S",
    color: "hsl(var(--chart-3))",
    fy24: { revenue: 520000, pct: 14.4, accounts: ["InsureMO"] },
    fy25Accounts: ["EbaoTech"],
    highlights: ["InsureMO/EbaoTech — sole account focus", "Deep specialist relationship", "Strong recurring revenue base"],
  },
  {
    name: "Sanjay C",
    initials: "SC",
    color: "hsl(var(--chart-4))",
    fy24: { revenue: 0, pct: 0, accounts: [] },
    fy25Accounts: ["AICB", "SD Guthrie"],
    highlights: ["AICB new account win", "SD Guthrie onboarded FY25", "Building new portfolio from scratch"],
  },
  {
    name: "Irfan",
    initials: "I",
    color: "hsl(210 60% 60%)",
    fy24: { revenue: 0, pct: 0, accounts: [] },
    fy25Accounts: ["Lenovo"],
    highlights: ["Lenovo account responsibility", "Building enterprise relationship"],
  },
  {
    name: "Eve",
    initials: "E",
    color: "hsl(30 80% 60%)",
    fy24: { revenue: 0, pct: 0, accounts: [] },
    fy25Accounts: ["Castrol"],
    highlights: ["Castrol account responsibility", "New business development"],
  },
];

function LeadInvoiceRow({ lead }: { lead: Lead }) {
  const { invoices: allInvoices } = useInvoices();
  const [open, setOpen] = useState(false);

  const invoices = allInvoices
    .filter((inv: Invoice) => inv.accountLead === lead.name)
    .sort((a: Invoice, b: Invoice) => b.date.localeCompare(a.date));

  const total = invoices.reduce((s, i) => s + i.totalBillingSGD, 0);
  const paid = invoices.filter(i => i.paymentReceivedMonth).length;

  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={{ borderColor: open ? lead.color : "hsl(var(--border))", background: "hsl(var(--card))" }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[hsl(var(--surface-3))]"
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${lead.color}22`, color: lead.color, border: `1.5px solid ${lead.color}` }}
        >
          {lead.initials}
        </div>

        {/* Name + accounts */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{lead.name}</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
            {lead.fy25.accounts.length > 0 ? lead.fy25.accounts.join(" · ") : "No accounts yet"}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Invoices</div>
            <div className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{invoices.length}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Paid</div>
            <div className="font-semibold text-sm" style={{ color: "hsl(var(--positive))" }}>{paid}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Total Billed</div>
            <div className="font-semibold text-sm mono" style={{ color: lead.color }}>
              {total > 0 ? `SGD ${formatNumber(total)}` : "—"}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Dropdown invoice table */}
      {open && (
        <div style={{ borderTop: `1px solid hsl(var(--border))`, background: "hsl(var(--surface-2))" }}>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <FileText className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No invoices found for {lead.name}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Invoice #", "Date", "Month", "Company", "Account", "Currency", "Amount", "GST", "Payment"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => {
                    const isPaid = !!inv.paymentReceivedMonth;
                    return (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom: idx < invoices.length - 1 ? "1px solid hsl(var(--border))" : "none",
                          background: idx % 2 === 0 ? "transparent" : "hsl(var(--surface-3) / 0.5)",
                        }}
                      >
                        <td className="px-4 py-2.5 mono text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {inv.date}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {inv.month}
                        </td>
                        <td className="px-4 py-2.5 text-xs max-w-[160px] truncate" style={{ color: "hsl(var(--foreground))" }}>
                          {inv.company}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${lead.color}22`, color: lead.color }}>
                            {inv.account}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {inv.currency}
                        </td>
                        <td className="px-4 py-2.5 mono text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                          SGD {formatNumber(inv.totalBillingSGD)}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {inv.hasGST
                            ? <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(var(--surface-4))", color: "hsl(var(--muted-foreground))" }}>9%</span>
                            : <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                          }
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {isPaid
                            ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "hsl(var(--positive) / 0.15)", color: "hsl(var(--positive))" }}>Paid · {inv.paymentReceivedMonth}</span>
                            : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "hsl(var(--warning) / 0.15)", color: "hsl(var(--warning))" }}>Pending</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer totals */}
                <tfoot>
                  <tr style={{ borderTop: "2px solid hsl(var(--border))" }}>
                    <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · {paid} paid · {invoices.length - paid} pending
                    </td>
                    <td className="px-4 py-2.5 mono text-sm font-bold" style={{ color: lead.color }}>
                      SGD {formatNumber(total)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountLeads() {
  const { invoices } = useInvoices();

  // FY25 revenue + share of total, computed live from the invoices table.
  const leads = useMemo<Lead[]>(() => {
    const fy25 = invoices.filter(i => i.fiscalYear === "FY2025");
    const grandTotal = fy25.reduce((s, i) => s + i.totalBillingSGD, 0);
    return LEAD_META.map(m => {
      const revenue = Math.round(
        fy25.filter(i => i.accountLead === m.name).reduce((s, i) => s + i.totalBillingSGD, 0),
      );
      const pct = grandTotal > 0 ? +((revenue / grandTotal) * 100).toFixed(1) : 0;
      return { ...m, fy25: { revenue, pct, accounts: m.fy25Accounts } };
    });
  }, [invoices]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>By Account Lead</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Revenue ownership and performance by account manager · Click any row to expand invoices</p>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {leads.map(lead => (
          <div key={lead.name} className="kpi-card text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3" style={{ background: `${lead.color}22`, color: lead.color, border: `1.5px solid ${lead.color}` }}>
              {lead.initials}
            </div>
            <div className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>{lead.name}</div>
            <div className="mono text-lg font-bold" style={{ color: lead.color }}>SGD {formatNumber(lead.fy25.revenue)}</div>
            <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>FY25 · {lead.fy25.pct}% of total</div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
              <div className="h-full rounded-full" style={{ width: `${lead.fy25.pct}%`, background: lead.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Dropdowns — one per lead */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Invoices by Salesperson</h2>
        {leads.map(lead => (
          <LeadInvoiceRow key={lead.name} lead={lead} />
        ))}
      </div>

      {/* Concentration Risk */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenue Concentration Risk Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--warning-muted))", border: "1px solid hsl(var(--warning) / 0.3)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--warning))" }}>⚠️ Single Lead Risk</div>
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Pooja manages 54.1% of all revenue. Industry best practice: no single lead should own &gt;40%. Consider cross-training and account sharing.
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--positive-muted))", border: "1px solid hsl(var(--positive) / 0.3)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--positive))" }}>✅ Growing Team</div>
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Team now has 6 account leads. Sanjay C, Irfan and Eve are new additions bringing AICB, SD Guthrie, Lenovo and Castrol accounts.
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "hsl(var(--negative-muted))", border: "1px solid hsl(var(--negative) / 0.3)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "hsl(var(--negative))" }}>🎯 Action Required</div>
            <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Define FY26 revenue targets per lead. William, Sandeep, Sanjay C, Irfan and Eve should each own ≥15% of total to ensure business continuity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
