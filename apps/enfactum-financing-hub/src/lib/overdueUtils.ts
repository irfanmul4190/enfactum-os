import { Invoice } from "@/data/invoiceData";
import { AccountTerms } from "@/contexts/PaymentTermsContext";

// Reference date for "today" — in a real app this would be new Date()
export const TODAY = new Date("2026-02-19");

export type AgingBucket = "current" | "0-30" | "31-60" | "61-90" | "90+";

export interface OverdueInvoice extends Invoice {
  daysOutstanding: number;
  agingBucket: AgingBucket;
  dueDate: Date;
  paymentTermDays: number; // actual term used for this invoice
}

/** Map month name to a calendar year, relative to the invoice date */
function resolvePaymentDate(paymentMonth: string, invoiceDate: Date): Date | null {
  const MONTH_MAP: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const key = paymentMonth.toLowerCase().trim();
  const monthIndex = MONTH_MAP[key];
  if (monthIndex === undefined) return null;

  const invoiceYear = invoiceDate.getFullYear();
  const invoiceMonth = invoiceDate.getMonth();
  let paymentYear = invoiceYear;
  if (monthIndex < invoiceMonth) paymentYear += 1;

  // Use last day of that payment month for conservative calculation
  return new Date(paymentYear, monthIndex + 1, 0);
}

export function getOverdueInvoices(
  invoices: Invoice[],
  today: Date = TODAY,
  accountTerms: AccountTerms = {},
): OverdueInvoice[] {
  const overdue: OverdueInvoice[] = [];

  for (const inv of invoices) {
    if (inv.totalBillingSGD <= 0) continue;
    if (inv.remarks?.toLowerCase().includes("credit")) continue;

    const invoiceDate = new Date(inv.date);
    if (isNaN(invoiceDate.getTime())) continue;

    // Use per-account term, fall back to 30 days
    const paymentTermDays: number = accountTerms[inv.account] ?? 30;

    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermDays);

    const isPaid = Boolean(inv.paymentReceivedMonth);

    if (isPaid) {
      const paymentDate = resolvePaymentDate(inv.paymentReceivedMonth!, invoiceDate);
      if (!paymentDate) continue;
      if (paymentDate <= dueDate) continue;
      const daysOutstanding = Math.floor((paymentDate.getTime() - dueDate.getTime()) / 86_400_000);
      overdue.push({ ...inv, daysOutstanding, agingBucket: getAgingBucket(daysOutstanding), dueDate, paymentTermDays });
    } else {
      if (today <= dueDate) continue;
      const daysOutstanding = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
      overdue.push({ ...inv, daysOutstanding, agingBucket: getAgingBucket(daysOutstanding), dueDate, paymentTermDays });
    }
  }

  return overdue.sort((a, b) => b.daysOutstanding - a.daysOutstanding);
}

function getAgingBucket(days: number): AgingBucket {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}


export const BUCKET_CONFIG: Record<AgingBucket, { label: string; color: string; bg: string; border: string }> = {
  "current": { label: "Current",   color: "hsl(var(--positive))",           bg: "hsl(var(--positive-muted))",  border: "hsl(var(--positive) / 0.3)" },
  "0-30":    { label: "0–30 days", color: "hsl(var(--warning))",             bg: "hsl(var(--warning-muted))",   border: "hsl(var(--warning) / 0.3)"  },
  "31-60":   { label: "31–60 days",color: "hsl(38 95% 45%)",                 bg: "hsl(38 95% 10%)",             border: "hsl(38 95% 45% / 0.3)"      },
  "61-90":   { label: "61–90 days",color: "hsl(var(--negative))",            bg: "hsl(var(--negative-muted))",  border: "hsl(var(--negative) / 0.3)" },
  "90+":     { label: "90+ days",  color: "hsl(0 90% 45%)",                  bg: "hsl(0 90% 10%)",              border: "hsl(0 90% 45% / 0.3)"       },
};
