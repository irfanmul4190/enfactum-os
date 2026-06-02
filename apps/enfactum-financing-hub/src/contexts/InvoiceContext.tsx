import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Invoice } from "@/data/invoiceData";
import { supabase } from "@/integrations/supabase/client";

// Row shape of public.invoices (see migration 20260522130000_financing_hub_invoices).
interface InvoiceRow {
  id: number;
  invoice_number: string;
  company: string;
  billed_to: string | null;
  date: string;
  account: string | null;
  account_lead: string | null;
  country: string | null;
  currency: string;
  has_gst: boolean;
  month: string | null;
  fiscal_year: string | null;
  amount_sgd_ex_tax: number | null;
  amount_sgd_with_tax: number | null;
  amount_usd_ex_tax: number | null;
  amount_usd_with_tax: number | null;
  amount_sgd_converted: number | null;
  total_billing_sgd: number;
  payment_received_month: string | null;
  remarks: string | null;
  revenue_type: string | null;
}

function rowToInvoice(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    company: r.company,
    billedTo: r.billed_to ?? "",
    date: r.date,
    amountSGDExTax: r.amount_sgd_ex_tax,
    amountSGDWithTax: r.amount_sgd_with_tax,
    amountUSDExTax: r.amount_usd_ex_tax,
    amountUSDWithTax: r.amount_usd_with_tax,
    amountSGDConverted: r.amount_sgd_converted,
    paymentReceivedMonth: r.payment_received_month,
    hasGST: r.has_gst,
    remarks: r.remarks ?? "",
    month: r.month ?? "",
    fiscalYear: r.fiscal_year ?? "",
    accountLead: r.account_lead ?? "",
    account: r.account ?? "",
    currency: r.currency === "USD" ? "USD" : "SGD",
    totalBillingSGD: r.total_billing_sgd,
    country: r.country ?? undefined,
    revenueType: r.revenue_type ?? undefined,
  };
}

// The id is omitted on write — the DB identity column assigns it.
function invoiceToRow(inv: Invoice): Omit<InvoiceRow, "id"> {
  return {
    invoice_number: inv.invoiceNumber,
    company: inv.company,
    billed_to: inv.billedTo || null,
    date: inv.date,
    account: inv.account || null,
    account_lead: inv.accountLead || null,
    country: inv.country || null,
    currency: inv.currency,
    has_gst: inv.hasGST,
    month: inv.month || null,
    fiscal_year: inv.fiscalYear || null,
    amount_sgd_ex_tax: inv.amountSGDExTax,
    amount_sgd_with_tax: inv.amountSGDWithTax,
    amount_usd_ex_tax: inv.amountUSDExTax,
    amount_usd_with_tax: inv.amountUSDWithTax,
    amount_sgd_converted: inv.amountSGDConverted,
    total_billing_sgd: inv.totalBillingSGD,
    payment_received_month: inv.paymentReceivedMonth,
    remarks: inv.remarks || null,
    revenue_type: inv.revenueType || null,
  };
}

interface InvoiceContextValue {
  invoices: Invoice[];
  loading: boolean;
  isLive: boolean; // true once invoices have loaded from Supabase
  error: string | null;
  addInvoice: (invoice: Invoice) => Promise<Invoice>;
  addInvoices: (invoices: Invoice[]) => Promise<Invoice[]>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextValue>({
  invoices: [],
  loading: false,
  isLive: false,
  error: null,
  addInvoice: async (i) => i,
  addInvoices: async () => [],
  updateInvoice: async () => {},
  deleteInvoice: async () => {},
  refresh: async () => {},
});

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("invoices")
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (err) {
      console.warn("Failed to load invoices from Supabase:", err.message);
      setError(err.message);
      setIsLive(false);
      setLoading(false);
      return;
    }
    setInvoices((data as InvoiceRow[]).map(rowToInvoice));
    setIsLive(true);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addInvoice = useCallback(async (invoice: Invoice): Promise<Invoice> => {
    const { data, error: err } = await supabase
      .from("invoices")
      .insert(invoiceToRow(invoice))
      .select()
      .single();
    if (err) throw err;
    const saved = rowToInvoice(data as InvoiceRow);
    setInvoices((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const addInvoices = useCallback(async (newInvoices: Invoice[]): Promise<Invoice[]> => {
    if (newInvoices.length === 0) return [];
    const { data, error: err } = await supabase
      .from("invoices")
      .insert(newInvoices.map(invoiceToRow))
      .select();
    if (err) throw err;
    const saved = (data as InvoiceRow[]).map(rowToInvoice);
    setInvoices((prev) => [...saved, ...prev]);
    return saved;
  }, []);

  const updateInvoice = useCallback(async (updated: Invoice): Promise<void> => {
    const { error: err } = await supabase
      .from("invoices")
      .update(invoiceToRow(updated))
      .eq("id", updated.id);
    if (err) throw err;
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
  }, []);

  const deleteInvoice = useCallback(async (id: number): Promise<void> => {
    const { error: err } = await supabase.from("invoices").delete().eq("id", id);
    if (err) throw err;
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  return (
    <InvoiceContext.Provider
      value={{ invoices, loading, isLive, error, addInvoice, addInvoices, updateInvoice, deleteInvoice, refresh }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  return useContext(InvoiceContext);
}
