export interface Invoice {
  id: number;
  invoiceNumber: string;
  company: string;
  billedTo: string;
  date: string;
  amountSGDExTax: number | null;
  amountSGDWithTax: number | null;
  amountUSDExTax: number | null;
  amountUSDWithTax: number | null;
  amountSGDConverted: number | null;
  paymentReceivedMonth: string | null;
  hasGST: boolean;
  remarks: string;
  month: string; // e.g. "Jan-24"
  fiscalYear: string; // "FY2024" | "FY2025"
  accountLead: string;
  account: string;
  currency: "SGD" | "USD";
  totalBillingSGD: number;
  country?: string;
  revenueType?: string;
}

export interface MonthlyRevenue {
  month: string;
  year: string;
  label: string; // "Apr-24"
  totalSGD: number;
  byAccount: Record<string, number>;
  byLead: Record<string, number>;
  byType?: Record<string, number>;
  byGeo?: Record<string, number>;
  invoices: Invoice[];
}

// Dropdown options — kept so the app's forms still work. Edit in the
// Settings UI once it exists; the labels themselves are not sensitive.
export const ACCOUNTS: string[] = [];
export const ACCOUNT_LEADS: string[] = [];
export const REVENUE_TYPES = ["Consulting", "Marketing Services", "Impact", "Manpower", "Pass-Thru"];
export const GEOGRAPHIES = ["Singapore", "Malaysia", "India", "Indonesia", "Others"];

// Demo/seed data cleared on 2026-05-19. Real data should flow via the Invoice
// Entry form and Supabase (v_contracts). Until backed by Supabase, the app
// will render empty "No data yet" states everywhere.
export const fy2025Monthly: MonthlyRevenue[] = [];

export const annualTargets: Record<string, { target: number; actual: number }> = {};

export const historicalRevenue: { year: string; revenue: number; growth: number | null }[] = [];

export const sampleInvoices: Invoice[] = [];

export function formatCurrency(amount: number, currency = "SGD"): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency === "SGD" ? "SGD" : "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}
