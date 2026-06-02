import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  FileText, Calculator, Users, DollarSign, AlertTriangle,
  RefreshCw, BarChart3, ClipboardList, Lock, Download
} from "lucide-react";
import { fy2025Monthly, annualTargets } from "@/data/invoiceData";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  required: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: ChecklistItem[];
}

// ── Static checklist template ────────────────────────────────────────────────

const SECTIONS: ChecklistSection[] = [
  {
    id: "invoices",
    title: "Invoice Completeness",
    icon: FileText,
    color: "hsl(var(--primary))",
    items: [
      { id: "inv-1", label: "All invoices issued and numbered sequentially", detail: "Verify no gaps in the ENF invoice sequence for the month.", required: true },
      { id: "inv-2", label: "Invoice dates fall within the correct month", detail: "No invoice dated outside the closed month's start–end range.", required: true },
      { id: "inv-3", label: "Credit notes matched to original invoices", detail: "Each credit note (CN-xxxxx) is linked to the invoice it offsets.", required: true },
      { id: "inv-4", label: "USD invoices have FX rate recorded", detail: "SGD-converted amount is captured at the agreed rate.", required: true },
      { id: "inv-5", label: "All draft invoices finalised or cancelled", detail: "No pending / draft invoices left open in the tracker.", required: false },
    ],
  },
  {
    id: "gst",
    title: "GST Reconciliation",
    icon: Calculator,
    color: "hsl(var(--warning))",
    items: [
      { id: "gst-1", label: "GST output tax totalled for all applicable invoices", detail: "Sum of 9% GST collected on SGD invoices marked GST = Yes.", required: true },
      { id: "gst-2", label: "Zero-rated and exempt invoices identified", detail: "USD overseas invoices and No-Tax invoices flagged correctly.", required: true },
      { id: "gst-3", label: "GST summary matches accounting system", detail: "Cross-check tracker GST total against Xero / QuickBooks output.", required: true },
      { id: "gst-4", label: "F5 return figures prepared (if quarterly filing)", detail: "Box 1 (Standard-rated supplies) and Box 6 (Output tax) completed.", required: false },
    ],
  },
  {
    id: "revenue",
    title: "Revenue Reconciliation",
    icon: BarChart3,
    color: "hsl(var(--positive))",
    items: [
      { id: "rev-1", label: "Monthly SGD revenue total agrees to tracker", detail: "Sum of totalBillingSGD across all non-credit invoices for the month.", required: true },
      { id: "rev-2", label: "Revenue split by account reconciled", detail: "HP, IT CAN, Oracle, EbaoTech, BFL, Others — each account total verified.", required: true },
      { id: "rev-3", label: "Revenue split by account lead reviewed", detail: "Pooja, Sandeep, William, Sanjay C, Irfan, Eve — totals signed off.", required: true },
      { id: "rev-4", label: "FY cumulative total updated", detail: "Rolling FY2025 YTD figure updated and compared to target.", required: true },
      { id: "rev-5", label: "Month-on-month variance documented", detail: "Any >20% MoM swing explained in notes.", required: false },
    ],
  },
  {
    id: "leads",
    title: "Account Lead Sign-off",
    icon: Users,
    color: "hsl(var(--chart-4))",
    items: [
      { id: "lead-1", label: "Pooja — revenue attribution confirmed", detail: "HP PPS, IT CAN Consulting, Oracle SE scope verified.", required: true },
      { id: "lead-2", label: "Sandeep — revenue attribution confirmed", detail: "EbaoTech, BFL, new business lines verified.", required: true },
      { id: "lead-3", label: "William — revenue attribution confirmed", detail: "Equinamity, Others pass-through invoices confirmed.", required: true },
      { id: "lead-4", label: "Irfan — revenue attribution confirmed", detail: "Lenovo accounts verified.", required: false },
      { id: "lead-5", label: "Man — revenue attribution confirmed", detail: "Manpower placements and pass-through reviewed.", required: false },
    ],
  },
  {
    id: "collections",
    title: "Collections & Payments",
    icon: DollarSign,
    color: "hsl(38 95% 45%)",
    items: [
      { id: "col-1", label: "Payment received month updated for all paid invoices", detail: "Every payment banked in the month has its paymentReceivedMonth field set.", required: true },
      { id: "col-2", label: "Outstanding invoices reviewed and chased", detail: "All unpaid invoices >30 days sent a payment reminder.", required: true },
      { id: "col-3", label: "Bank receipts matched to invoices", detail: "Each bank credit line matched 1-to-1 with an invoice in the tracker.", required: true },
      { id: "col-4", label: "Partial payments documented", detail: "Any partial receipt noted in the Remarks column.", required: false },
    ],
  },
  {
    id: "reporting",
    title: "Management Reporting",
    icon: ClipboardList,
    color: "hsl(var(--chart-5))",
    items: [
      { id: "rep-1", label: "Monthly revenue slide updated", detail: "Dashboard chart reflects the closed month's final number.", required: true },
      { id: "rep-2", label: "FY2025 target tracker updated", detail: "% achieved against SGD 7M target recalculated.", required: true },
      { id: "rep-3", label: "Account lead performance table emailed", detail: "Revenue by lead table sent to management by the 5th.", required: false },
      { id: "rep-4", label: "Overdue report shared with leads", detail: "Each lead notified of their outstanding invoices.", required: false },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_MONTHS = [
  ...fy2025Monthly.map(m => ({ label: m.label, totalSGD: m.totalSGD, key: `FY2025-${m.label}` })),
];

const CURRENT_MONTH = "Jan-26";

function monthRevenueByLead(monthLabel: string) {
  const m = fy2025Monthly.find(m => m.label === monthLabel);
  if (!m) return {};
  return m.byLead ?? {};
}

function monthRevenue(monthLabel: string) {
  return fy2025Monthly.find(m => m.label === monthLabel);
}

function generateCSV(
  selectedMonth: string,
  monthData: ReturnType<typeof monthRevenue>,
  leadBreakdown: Record<string, number>,
  fy25YTD: number,
  fy25Target: number,
  checkedItems: Record<string, boolean>,
  notes: Record<string, string>
): void {
  const rows: string[] = [];

  const fmt = (n: number) => `SGD ${n.toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const pctFmt = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—";

  const now = new Date();
  const generated = now.toLocaleDateString("en-SG", { day: "2-digit", month: "long", year: "numeric" });

  rows.push(`"ENFACTUM — MONTH-END CLOSE REPORT"`);
  rows.push(`"Month","${selectedMonth}"`);
  rows.push(`"Generated","${generated}"`);
  rows.push(``);

  // ── Revenue Summary ──
  rows.push(`"REVENUE SUMMARY"`);
  rows.push(`"Metric","Value"`);
  if (monthData) {
    const exGST = Math.round(monthData.totalSGD / 1.09);
    const gst = monthData.totalSGD - exGST;
    rows.push(`"Total Billed (incl. GST)","${fmt(monthData.totalSGD)}"`);
    rows.push(`"Revenue ex-GST (est.)","${fmt(exGST)}"`);
    rows.push(`"GST Collected (est.)","${fmt(gst)}"`);
  } else {
    rows.push(`"Total Billed","—"`);
  }
  rows.push(`"FY2025 YTD","${fmt(fy25YTD)}"`);
  rows.push(`"FY2025 Target","${fmt(fy25Target)}"`);
  rows.push(`"FY2025 % Achieved","${pctFmt(fy25YTD, fy25Target)}"`);
  rows.push(``);

  // ── By Account ──
  rows.push(`"REVENUE BY ACCOUNT"`);
  rows.push(`"Account","Amount (SGD)","% of Month"`);
  if (monthData) {
    (Object.entries(monthData.byAccount) as [string, number][])
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([account, amount]) => {
        rows.push(`"${account}","${fmt(amount)}","${pctFmt(amount, monthData.totalSGD)}"`);
      });
    rows.push(`"TOTAL","${fmt(monthData.totalSGD)}","100.0%"`);
  }
  rows.push(``);

  // ── By Lead ──
  rows.push(`"REVENUE BY ACCOUNT LEAD"`);
  const leadEntries = Object.entries(leadBreakdown).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  if (leadEntries.length > 0) {
    rows.push(`"Account Lead","Amount (SGD)","% of Month"`);
    const total = leadEntries.reduce((s, [, v]) => s + v, 0);
    leadEntries.forEach(([lead, amount]) => {
      rows.push(`"${lead}","${fmt(amount)}","${pctFmt(amount, total)}"`);
    });
    rows.push(`"TOTAL","${fmt(total)}","100.0%"`);
  } else {
    rows.push(`"Lead breakdown not available for ${selectedMonth}"`);
  }
  rows.push(``);

  // ── By Revenue Type ──
  if (monthData?.byType && Object.keys(monthData.byType).length > 0) {
    rows.push(`"REVENUE BY TYPE"`);
    rows.push(`"Type","Amount (SGD)","% of Month"`);
    (Object.entries(monthData.byType) as [string, number][])
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, amount]) => {
        rows.push(`"${type}","${fmt(amount)}","${pctFmt(amount, monthData.totalSGD)}"`);
      });
    rows.push(``);
  }

  // ── By Geography ──
  if (monthData?.byGeo && Object.keys(monthData.byGeo).length > 0) {
    rows.push(`"REVENUE BY GEOGRAPHY"`);
    rows.push(`"Geography","Amount (SGD)","% of Month"`);
    (Object.entries(monthData.byGeo) as [string, number][])
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .forEach(([geo, amount]) => {
        rows.push(`"${geo}","${fmt(amount)}","${pctFmt(amount, monthData.totalSGD)}"`);
      });
    rows.push(``);
  }

  // ── Checklist Status ──
  rows.push(`"CLOSE CHECKLIST STATUS"`);
  rows.push(`"Section","Item","Required","Status","Notes"`);
  SECTIONS.forEach(section => {
    section.items.forEach(item => {
      const status = checkedItems[item.id] ? "Done" : "Pending";
      const note = (notes[item.id] ?? "").replace(/"/g, '""');
      rows.push(`"${section.title}","${item.label}","${item.required ? "Yes" : "No"}","${status}","${note}"`);
    });
  });

  // Download
  const csv = rows.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Enfactum_MonthEnd_${selectedMonth.replace("-", "_")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MonthlyClose() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map(s => [s.id, true]))
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  const toggle = (id: string) =>
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleSection = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const allItems = SECTIONS.flatMap(s => s.items);
  const requiredItems = allItems.filter(i => i.required);
  const completedAll = allItems.filter(i => checked[i.id]).length;
  const completedRequired = requiredItems.filter(i => checked[i.id]).length;
  const pctAll = Math.round((completedAll / allItems.length) * 100);
  const pctRequired = Math.round((completedRequired / requiredItems.length) * 100);

  const monthData = useMemo(() => monthRevenue(selectedMonth), [selectedMonth]);
  const leadBreakdown = useMemo(() => monthRevenueByLead(selectedMonth), [selectedMonth]);

  const fy25YTD = annualTargets.FY2025.actual;
  const fy25Target = annualTargets.FY2025.target;

  const isLocked = pctRequired === 100;

  function resetChecklist() {
    setChecked({});
    setNotes({});
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>Monthly Close Checklist</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Step-by-step month-end close process for Enfactum
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setChecked({}); setNotes({}); }}
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          >
            {ALL_MONTHS.map(m => (
              <option key={m.key} value={m.label}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={resetChecklist}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={() => generateCSV(selectedMonth, monthData, leadBreakdown, fy25YTD, fy25Target, checked, notes)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Progress KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <div className="kpi-card relative overflow-hidden col-span-2">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "var(--gradient-primary)" }} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Overall Progress</div>
            {isLocked && (
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "hsl(var(--positive))" }}>
                <Lock className="w-3 h-3" /> Close Ready
              </div>
            )}
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div className="mono text-3xl font-bold" style={{ color: "hsl(var(--primary))" }}>{pctAll}%</div>
            <div className="text-sm mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{completedAll} / {allItems.length} steps</div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctAll}%`, background: "var(--gradient-primary)" }} />
          </div>
        </div>

        {/* Required items */}
        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: pctRequired === 100 ? "hsl(var(--positive))" : "hsl(var(--warning))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>Mandatory Items</div>
          <div className="mono text-2xl font-bold mb-1" style={{ color: pctRequired === 100 ? "hsl(var(--positive))" : "hsl(var(--warning))" }}>
            {completedRequired}/{requiredItems.length}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>required steps done</div>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctRequired}%`, background: pctRequired === 100 ? "hsl(var(--positive))" : "hsl(var(--warning))" }} />
          </div>
        </div>

        {/* Month revenue snapshot */}
        <div className="kpi-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "hsl(var(--positive))" }} />
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            {selectedMonth} Revenue
          </div>
          <div className="mono text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
            {monthData ? `SGD ${(monthData.totalSGD / 1000).toFixed(0)}K` : "—"}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>total billed (incl. GST)</div>
          {monthData && (
            <div className="mt-2 text-xs mono font-semibold" style={{ color: "hsl(var(--positive))" }}>
              GST ~SGD {Math.round((monthData.totalSGD - monthData.totalSGD / 1.09)).toLocaleString("en-SG")}
            </div>
          )}
        </div>
      </div>

      {/* Month Revenue Summary Cards */}
      {monthData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* By Account */}
          <div className="kpi-card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenue by Account — {selectedMonth}</h3>
            <div className="space-y-2">
              {(Object.entries(monthData.byAccount) as [string, number][])
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([account, amount]) => {
                  const pct = monthData.totalSGD > 0 ? (amount / monthData.totalSGD) * 100 : 0;
                  return (
                    <div key={account} className="flex items-center gap-3">
                      <div className="w-20 text-xs font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{account}</div>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                      </div>
                      <div className="mono text-xs w-24 text-right" style={{ color: "hsl(var(--foreground))" }}>
                        SGD {amount.toLocaleString("en-SG", { maximumFractionDigits: 0 })}
                      </div>
                      <div className="mono text-xs w-8 text-right" style={{ color: "hsl(var(--muted-foreground))" }}>{pct.toFixed(0)}%</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Lead + FY progress */}
          <div className="space-y-4">
            {Object.keys(leadBreakdown).length > 0 ? (
              <div className="kpi-card">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>Revenue by Account Lead — {selectedMonth}</h3>
                <div className="space-y-2">
                  {(Object.entries(leadBreakdown) as [string, number][])
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lead, amount]) => {
                      const pct = monthData.totalSGD > 0 ? (amount / monthData.totalSGD) * 100 : 0;
                      return (
                        <div key={lead} className="flex items-center gap-3">
                          <div className="w-16 text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>{lead}</div>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-accent)" }} />
                          </div>
                          <div className="mono text-xs w-24 text-right" style={{ color: "hsl(var(--foreground))" }}>
                            SGD {amount.toLocaleString("en-SG", { maximumFractionDigits: 0 })}
                          </div>
                          <div className="mono text-xs w-8 text-right" style={{ color: "hsl(var(--muted-foreground))" }}>{pct.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="kpi-card flex items-center justify-center" style={{ minHeight: 120 }}>
                <div className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>Lead breakdown not available for {selectedMonth}</div>
              </div>
            )}

            {/* FY Progress */}
            <div className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>FY2025 Target Progress</h3>
                <span className="mono text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
                  {((fy25YTD / fy25Target) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--surface-4))" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((fy25YTD / fy25Target) * 100, 100)}%`, background: "var(--gradient-primary)" }} />
              </div>
              <div className="flex justify-between text-xs mono">
                <span style={{ color: "hsl(var(--foreground))" }}>SGD {(fy25YTD / 1_000_000).toFixed(2)}M achieved</span>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>of SGD {(fy25Target / 1_000_000).toFixed(1)}M target</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Sections */}
      <div className="space-y-3">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const sectionItems = section.items;
          const done = sectionItems.filter(i => checked[i.id]).length;
          const isOpen = expanded[section.id];
          const allDone = done === sectionItems.length;

          return (
            <div
              key={section.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: allDone ? `${section.color}4D` : "hsl(var(--border))" }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                style={{ background: allDone ? `${section.color}0D` : "hsl(var(--surface-3))" }}
              >
                <div className="p-1.5 rounded-lg" style={{ background: `${section.color}1A` }}>
                  <Icon className="w-4 h-4" style={{ color: section.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{section.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {done}/{sectionItems.length} completed
                  </div>
                </div>

                {/* Mini progress */}
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-4))" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${(done / sectionItems.length) * 100}%`, background: section.color }}
                    />
                  </div>
                  {allDone
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: section.color }} />
                    : isOpen
                      ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                      : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                  }
                </div>
              </button>

              {/* Items */}
              {isOpen && (
                <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                  {sectionItems.map((item, idx) => {
                    const isDone = Boolean(checked[item.id]);
                    const hasNote = Boolean(notes[item.id]);
                    const showingNote = showNoteFor === item.id;

                    return (
                      <div
                        key={item.id}
                        className="px-5 py-3.5 transition-colors"
                        style={{
                          background: isDone ? `${section.color}08` : "hsl(var(--card))",
                          borderTop: idx === 0 ? `1px solid hsl(var(--border))` : undefined,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggle(item.id)}
                            className="mt-0.5 shrink-0 transition-transform active:scale-90"
                          >
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5" style={{ color: section.color }} />
                              : <Circle className="w-5 h-5" style={{ color: "hsl(var(--surface-4))" }} />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn("text-sm font-medium", isDone && "line-through")}
                                style={{ color: isDone ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}
                              >
                                {item.label}
                              </span>
                              {item.required && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                  style={{ background: "hsl(var(--negative-muted))", color: "hsl(var(--negative))" }}
                                >
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{item.detail}</p>

                            {/* Note area */}
                            {showingNote ? (
                              <textarea
                                autoFocus
                                rows={2}
                                placeholder="Add a note…"
                                value={notes[item.id] ?? ""}
                                onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onBlur={() => setShowNoteFor(null)}
                                className="mt-2 w-full px-3 py-2 rounded-lg border text-xs resize-none outline-none"
                                style={{ background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                              />
                            ) : (
                              hasNote && (
                                <div
                                  onClick={() => setShowNoteFor(item.id)}
                                  className="mt-1.5 text-xs px-2 py-1 rounded cursor-pointer italic"
                                  style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--surface-3))" }}
                                >
                                  📝 {notes[item.id]}
                                </div>
                              )
                            )}
                          </div>

                          <button
                            onClick={() => setShowNoteFor(showingNote ? null : item.id)}
                            className="shrink-0 text-xs px-2 py-1 rounded transition-colors"
                            style={{
                              color: hasNote ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                              background: hasNote ? "hsl(var(--primary) / 0.1)" : "transparent"
                            }}
                          >
                            {hasNote ? "✏️" : "+ Note"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Close Ready Banner */}
      {isLocked && (
        <div
          className="rounded-xl border p-5 flex items-center gap-4 animate-fade-in"
          style={{ background: "hsl(var(--positive-muted))", borderColor: "hsl(var(--positive) / 0.4)" }}
        >
          <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: "hsl(var(--positive))" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "hsl(var(--positive))" }}>
              ✅ {selectedMonth} is ready to close!
            </div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              All mandatory steps completed. You may lock the month and proceed to management reporting.
            </div>
          </div>
        </div>
      )}

      {/* Remaining mandatory warning */}
      {!isLocked && completedRequired < requiredItems.length && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "hsl(var(--warning-muted))", borderColor: "hsl(var(--warning) / 0.3)" }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
          <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="font-semibold" style={{ color: "hsl(var(--warning))" }}>
              {requiredItems.length - completedRequired} mandatory step{requiredItems.length - completedRequired !== 1 ? "s" : ""} remaining
            </span>
            {" "}before {selectedMonth} can be closed.
          </div>
        </div>
      )}

    </div>
  );
}
