// Enfactum fiscal year starts April. FY2026 = April 2026 → March 2027.
// One source of truth for FY math; both UI labels and aggregations consume it.

import type { Invoice } from "@/data/invoiceData";

export const MONTH_ORDER = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"] as const;

export const QUARTERS = [
  { label: "Q1 Apr–Jun", short: "Q1", months: ["Apr","May","Jun"] },
  { label: "Q2 Jul–Sep", short: "Q2", months: ["Jul","Aug","Sep"] },
  { label: "Q3 Oct–Dec", short: "Q3", months: ["Oct","Nov","Dec"] },
  { label: "Q4 Jan–Mar", short: "Q4", months: ["Jan","Feb","Mar"] },
] as const;

export function currentFY(date: Date = new Date()): string {
  const y = date.getFullYear();
  // Months 0–11. April = 3. Anything Jan–Mar (0–2) belongs to the *previous*
  // calendar year's FY label.
  return `FY${date.getMonth() >= 3 ? y : y - 1}`;
}

// FY of a label like "May-26" → "FY2026". Returns null if unparseable.
export function fyFromMonthLabel(label: string | undefined | null): string | null {
  if (!label) return null;
  const [m, yy] = label.split("-");
  const monthIdx = MONTH_ORDER.indexOf(m as typeof MONTH_ORDER[number]);
  if (monthIdx === -1 || !yy) return null;
  const year = 2000 + parseInt(yy, 10);
  // months 0–8 of MONTH_ORDER (Apr–Dec) → same calendar year is the FY
  // months 9–11 (Jan–Mar) → year - 1 is the FY
  return `FY${monthIdx <= 8 ? year : year - 1}`;
}

// Filter helpers
export function invoicesInFY(invoices: Invoice[], fy: string): Invoice[] {
  return invoices.filter((i) => i.fiscalYear === fy);
}

// Aggregations — each returns plain arrays/objects, no React inside.
export function monthlyTotals(invoices: Invoice[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const inv of invoices) {
    const m = inv.month.split("-")[0];
    out[m] = (out[m] ?? 0) + inv.totalBillingSGD;
  }
  return out;
}

export function quarterlyTotals(invoices: Invoice[]): Record<string, number> {
  const monthly = monthlyTotals(invoices);
  const out: Record<string, number> = {};
  for (const q of QUARTERS) {
    out[q.short] = q.months.reduce((s, m) => s + (monthly[m] ?? 0), 0);
  }
  return out;
}

export function byAccount(invoices: Invoice[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const inv of invoices) {
    if (!inv.account) continue;
    map[inv.account] = (map[inv.account] ?? 0) + inv.totalBillingSGD;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function byLead(invoices: Invoice[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const inv of invoices) {
    if (!inv.accountLead) continue;
    map[inv.accountLead] = (map[inv.accountLead] ?? 0) + inv.totalBillingSGD;
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Color palette — assigns one of the chart palette slots to each account in
// the order they're encountered (so adding a new account doesn't reshuffle
// existing colors). Falls through to muted-foreground after we run out.
const PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210 60% 70%)",
  "hsl(30 80% 60%)",
  "hsl(260 60% 65%)",
];

export function colorForAccount(
  account: string,
  accounts: string[],
): string {
  const idx = accounts.indexOf(account);
  if (idx === -1 || idx >= PALETTE.length) return "hsl(var(--muted-foreground))";
  return PALETTE[idx];
}
