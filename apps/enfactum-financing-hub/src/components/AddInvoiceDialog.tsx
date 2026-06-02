import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, AlertCircle, CheckCircle2, Info, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Invoice } from "@/data/invoiceData";
import { cn } from "@/lib/utils";
import { useFxRate } from "@/contexts/FxRateContext";
import { useActiveAccountNames, useActiveLeadNames } from "@/hooks/useAccounts";

const GST_RATE = 0.09;

// ACCOUNTS / LEADS now come from Supabase (see hook calls inside the
// component). Adding a new account/lead is done via the admin UI or SQL,
// not by editing this file.
const COUNTRIES = ["Singapore", "India", "Malaysia", "Indonesia", "Others"];
const CURRENCIES = [
  { code: "SGD", label: "Sing$" },
  { code: "USD", label: "US$" },
  { code: "MYR", label: "Ringgit" },
  { code: "INR", label: "INR" },
  { code: "OTH", label: "Others" },
] as const;

const PAYMENT_MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const invoiceSchema = z.object({
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(30, "Max 30 characters")
    .regex(/^[A-Za-z0-9\-]+$/, "Only letters, numbers and hyphens allowed"),
  company: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(120, "Max 120 characters"),
  billedTo: z
    .string()
    .trim()
    .min(1, "Billed-to contact is required")
    .max(120, "Max 120 characters"),
  date: z
    .string()
    .min(1, "Invoice date is required"),
  account: z
    .string()
    .min(1, "Account is required"),
  accountLead: z
    .string()
    .min(1, "Account lead is required"),
  currency: z.string().min(1, "Currency is required"),
  country: z.string().min(1, "Country is required"),
  amountExTax: z
    .string()
    .min(1, "Amount is required")
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Must be a valid positive number")
    .refine(v => parseFloat(v) <= 10_000_000, "Amount seems too large — please verify"),
  hasGST: z.boolean(),
  isCreditNote: z.boolean(),
  paymentReceivedMonth: z.string().max(20),
  remarks: z.string().trim().max(200, "Max 200 characters"),
});

type FormValues = z.infer<typeof invoiceSchema>;

interface AddInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (invoice: Invoice) => void;
  onSave?: (invoice: Invoice) => void;
  onDelete?: (id: number) => void;
  nextId: number;
  existingNumbers: string[];
  editInvoice?: Invoice | null;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--negative))" }} />
      <span className="text-xs" style={{ color: "hsl(var(--negative))" }}>{msg}</span>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
      {children}
      {required && <span className="ml-0.5" style={{ color: "hsl(var(--negative))" }}>*</span>}
    </label>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-1 focus:ring-primary";
const inputStyle = { background: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" };

/** Derive the ex-tax amount from an invoice for pre-filling */
function deriveExTax(inv: Invoice): string {
  if (inv.currency === "USD" && inv.amountUSDExTax != null) return String(inv.amountUSDExTax);
  if (inv.currency === "SGD" && inv.amountSGDExTax != null) return String(inv.amountSGDExTax);
  // Fallback: reverse from totalBillingSGD
  if (inv.hasGST && inv.totalBillingSGD > 0) return String(Math.round((inv.totalBillingSGD / 1.09) * 100) / 100);
  return String(inv.totalBillingSGD ?? 0);
}

export function AddInvoiceDialog({ open, onClose, onAdd, onSave, onDelete, nextId, existingNumbers, editInvoice }: AddInvoiceDialogProps) {
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { usdToSgd } = useFxRate();
  const ACCOUNTS = useActiveAccountNames();
  const LEADS = useActiveLeadNames();
  const isEditMode = Boolean(editInvoice);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: "onChange",
    defaultValues: {
      currency: "SGD",
      country: "Singapore",
      hasGST: true,
      isCreditNote: false,
      paymentReceivedMonth: "",
      remarks: "",
      amountExTax: "",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editInvoice && open) {
      reset({
        invoiceNumber: editInvoice.invoiceNumber,
        company: editInvoice.company,
        billedTo: editInvoice.billedTo,
        date: editInvoice.date,
        account: editInvoice.account,
        accountLead: editInvoice.accountLead,
        currency: editInvoice.currency,
        country: editInvoice.country ?? "Singapore",
        amountExTax: deriveExTax(editInvoice),
        hasGST: editInvoice.hasGST,
        isCreditNote: editInvoice.remarks?.toLowerCase().includes("credit") ?? false,
        paymentReceivedMonth: editInvoice.paymentReceivedMonth ?? "",
        remarks: editInvoice.remarks?.toLowerCase().includes("credit") ? "" : (editInvoice.remarks ?? ""),
      });
    } else if (!editInvoice && open) {
      reset({
        currency: "SGD",
        country: "Singapore",
        hasGST: true,
        isCreditNote: false,
        paymentReceivedMonth: "",
        remarks: "",
        amountExTax: "",
      });
    }
  }, [editInvoice, open, reset]);

  const currency = watch("currency");
  const country = watch("country");
  const hasGST = watch("hasGST");
  const isCreditNote = watch("isCreditNote");
  const amountExTaxStr = watch("amountExTax");
  const dateStr = watch("date");

  // Derived values
  const amountExTax = parseFloat(amountExTaxStr) || 0;
  const gstAmount = hasGST && !isCreditNote ? amountExTax * GST_RATE : 0;
  const amountWithTax = amountExTax + gstAmount;
  const totalBillingSGD = currency === "USD" ? amountWithTax * usdToSgd : amountWithTax;

  // Auto-derive month label from date
  const monthLabel = (() => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
  })();

  const fiscalYear = (() => {
    // Default to the FY of *today* when there's no entered date, rather than
    // a static "FY2025" string (which got stale the moment the fiscal year
    // rolled over to FY2026 in April 2026). FY starts in April.
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return "";
    const month = d.getMonth();
    const year = d.getFullYear();
    return month >= 3 ? `FY${year}` : `FY${year - 1}`;
  })();

  function buildInvoice(data: FormValues, id: number): Invoice {
    const amt = parseFloat(data.amountExTax);
    const gst = data.hasGST && !data.isCreditNote ? amt * GST_RATE : 0;
    const withTax = amt + gst;
    // For SGD and MYR/INR/OTH treat as SGD-equivalent; USD uses FX
    const isUSD = data.currency === "USD";
    const sgdTotal = isUSD ? withTax * usdToSgd : withTax;
    // Map currency to Invoice.currency type (non-SGD/USD stored as USD slot)
    const invoiceCurrency: "SGD" | "USD" = isUSD ? "USD" : "SGD";

    return {
      id,
      invoiceNumber: data.invoiceNumber.toUpperCase(),
      company: data.company.trim(),
      billedTo: data.billedTo.trim(),
      date: data.date,
      amountSGDExTax: !isUSD ? amt : null,
      amountSGDWithTax: !isUSD ? withTax : null,
      amountUSDExTax: isUSD ? amt : null,
      amountUSDWithTax: isUSD ? withTax : null,
      amountSGDConverted: isUSD ? sgdTotal : null,
      paymentReceivedMonth: data.paymentReceivedMonth || null,
      hasGST: data.hasGST,
      remarks: data.isCreditNote ? "Credit Note" : (data.remarks.trim() || data.currency !== "SGD" && data.currency !== "USD" ? `Currency: ${data.currency}` : data.remarks.trim()),
      month: monthLabel,
      fiscalYear,
      accountLead: data.accountLead,
      account: data.account,
      currency: invoiceCurrency,
      country: data.country,
      totalBillingSGD: data.isCreditNote ? 0 : sgdTotal,
    };
  }

  function onSubmit(data: FormValues) {
    if (isEditMode && editInvoice) {
      const updated = buildInvoice(data, editInvoice.id);
      onSave?.(updated);
    } else {
      const newInvoice = buildInvoice(data, nextId);
      onAdd(newInvoice);
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      reset();
      onClose();
    }, 1200);
  }

  function handleClose() {
    reset();
    setSubmitted(false);
    setConfirmDelete(false);
    onClose();
  }

  function handleDeleteConfirmed() {
    if (editInvoice) {
      onDelete?.(editInvoice.id);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>

        {/* Success overlay */}
        {submitted && (
          <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center" style={{ background: "hsl(var(--card))" }}>
            <CheckCircle2 className="w-14 h-14 mb-3" style={{ color: "hsl(var(--positive))" }} />
            <div className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {isEditMode ? "Invoice Updated!" : "Invoice Added!"}
            </div>
            <div className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {isEditMode ? "Changes saved to the tracker." : "It will appear in the tracker now."}
            </div>
          </div>
        )}


        {/* Country selector — parent level, outside form */}
        <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
          {COUNTRIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("country", c, { shouldValidate: true })}
              className="flex-1 py-3 text-xs font-semibold transition-all"
              style={country === c
                ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                : { background: "hsl(var(--surface-3))", color: "hsl(var(--muted-foreground))" }
              }
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 flex items-center justify-center transition-colors hover:bg-secondary"
            style={{ background: "hsl(var(--surface-3))", color: "hsl(var(--muted-foreground))", borderLeft: "1px solid hsl(var(--border))" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

          {/* Currency selector */}
          <div>
            <Label required>Currency</Label>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
              {CURRENCIES.map(cur => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => setValue("currency", cur.code)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all"
                  style={currency === cur.code
                    ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                    : { background: "hsl(var(--surface-2))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {cur.label}
                </button>
              ))}
            </div>
            {currency === "USD" && (
              <div className="flex items-center gap-1 mt-1.5">
                <Info className="w-3 h-3" style={{ color: "hsl(var(--warning))" }} />
                <span className="text-xs" style={{ color: "hsl(var(--warning))" }}>FX rate: 1 USD = {usdToSgd.toFixed(4)} SGD</span>
              </div>
            )}
          </div>

          {/* Row 1: Invoice Number + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Invoice Number</Label>
              <input
                {...register("invoiceNumber")}
                placeholder="ENF25006"
                className={cn(inputCls, errors.invoiceNumber && "border-red-500/50")}
                style={inputStyle}
                maxLength={30}
              />
              <FieldError msg={errors.invoiceNumber?.message} />
            </div>
            <div>
              <Label required>Invoice Date</Label>
              <input
                {...register("date")}
                type="date"
                className={cn(inputCls, errors.date && "border-red-500/50")}
                style={inputStyle}
              />
              {monthLabel && (
                <div className="flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--primary))" }}>Month: {monthLabel} · {fiscalYear}</span>
                </div>
              )}
              <FieldError msg={errors.date?.message} />
            </div>
          </div>

          {/* Row 2: Company + Billed To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Company</Label>
              <input
                {...register("company")}
                placeholder="Billing entity name"
                className={cn(inputCls, errors.company && "border-red-500/50")}
                style={inputStyle}
                maxLength={120}
              />
              <FieldError msg={errors.company?.message} />
            </div>
            <div>
              <Label required>Billed To (Contact)</Label>
              <input
                {...register("billedTo")}
                placeholder="Chiu Chun Min"
                className={cn(inputCls, errors.billedTo && "border-red-500/50")}
                style={inputStyle}
                maxLength={120}
              />
              <FieldError msg={errors.billedTo?.message} />
            </div>
          </div>

          {/* Row 3: Account + Account Lead */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Account</Label>
              <select
                {...register("account")}
                className={cn(inputCls, errors.account && "border-red-500/50")}
                style={inputStyle}
              >
                <option value="">Select account…</option>
                {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <FieldError msg={errors.account?.message} />
            </div>
            <div>
              <Label required>Account Lead</Label>
              <select
                {...register("accountLead")}
                className={cn(inputCls, errors.accountLead && "border-red-500/50")}
                style={inputStyle}
              >
                <option value="">Select lead…</option>
                {LEADS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <FieldError msg={errors.accountLead?.message} />
            </div>
          </div>

          {/* Amount Ex-Tax */}
          <div>
            <Label required>Amount Ex-Tax ({currency})</Label>
            <input
              {...register("amountExTax")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn(inputCls, "mono", errors.amountExTax && "border-red-500/50")}
              style={inputStyle}
            />
            <FieldError msg={errors.amountExTax?.message} />
          </div>

          {/* GST + Credit Note toggles */}
          <div className="flex gap-6 p-4 rounded-xl" style={{ background: "hsl(var(--surface-3))" }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setValue("hasGST", !hasGST)}
                className="w-10 h-6 rounded-full relative transition-all cursor-pointer"
                style={{ background: hasGST ? "hsl(var(--positive))" : "hsl(var(--surface-4))" }}
              >
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: hasGST ? "22px" : "4px" }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>GST Applicable (9%)</div>
                {hasGST && amountExTax > 0 && !isCreditNote && (
                  <div className="text-xs mono" style={{ color: "hsl(var(--positive))" }}>
                    +{currency} {(amountExTax * GST_RATE).toFixed(2)} GST
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setValue("isCreditNote", !isCreditNote)}
                className="w-10 h-6 rounded-full relative transition-all cursor-pointer"
                style={{ background: isCreditNote ? "hsl(var(--negative))" : "hsl(var(--surface-4))" }}
              >
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: isCreditNote ? "22px" : "4px" }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Credit Note</div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Amount will be SGD 0</div>
              </div>
            </label>
          </div>

          {/* Live calculation preview */}
          {amountExTax > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: "hsl(var(--primary) / 0.05)", borderColor: "hsl(var(--primary) / 0.2)" }}>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>Invoice Calculation</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>Amount Ex-Tax</span>
                  <span className="mono font-medium" style={{ color: "hsl(var(--foreground))" }}>{currency} {amountExTax.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>
                </div>
                {hasGST && !isCreditNote && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>GST (9%)</span>
                    <span className="mono font-medium stat-positive">+ {currency} {gstAmount.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-sm font-semibold" style={{ borderColor: "hsl(var(--border))" }}>
                  <span style={{ color: "hsl(var(--foreground))" }}>Amount With Tax</span>
                  <span className="mono" style={{ color: "hsl(var(--foreground))" }}>{currency} {amountWithTax.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>
                </div>
                {currency === "USD" && (
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{ color: "hsl(var(--primary))" }}>SGD Equivalent (×{usdToSgd.toFixed(4)})</span>
                    <span className="mono" style={{ color: "hsl(var(--primary))" }}>SGD {totalBillingSGD.toLocaleString("en-SG", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {isCreditNote && (
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{ color: "hsl(var(--negative))" }}>Total Billing (Credit Note)</span>
                    <span className="mono" style={{ color: "hsl(var(--negative))" }}>SGD 0.00</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row 5: Payment Status + Remarks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Received Month</Label>
              <select
                {...register("paymentReceivedMonth")}
                className={inputCls}
                style={inputStyle}
              >
                {PAYMENT_MONTHS.map(m => <option key={m} value={m}>{m || "— Not yet received —"}</option>)}
              </select>
            </div>
            <div>
              <Label>Remarks</Label>
              <input
                {...register("remarks")}
                placeholder="e.g. No Tax, HP Partner, deferred to next month…"
                className={cn(inputCls, errors.remarks && "border-red-500/50")}
                style={inputStyle}
                maxLength={200}
              />
              <FieldError msg={errors.remarks?.message} />
            </div>
          </div>

          {/* Delete confirmation banner */}
          {confirmDelete && isEditMode && (
            <div className="rounded-xl p-4 border flex items-start gap-3" style={{ background: "hsl(var(--negative) / 0.08)", borderColor: "hsl(var(--negative) / 0.4)" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--negative))" }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: "hsl(var(--negative))" }}>Delete this invoice?</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <span className="font-semibold mono">{editInvoice?.invoiceNumber}</span> will be permanently removed. This cannot be undone.
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-secondary"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "hsl(var(--negative))", color: "white" }}
                >
                  <Trash2 className="w-3 h-3" /> Yes, Delete
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-secondary"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Cancel
              </button>
              {isEditMode && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-secondary"
                  style={{ color: "hsl(var(--negative))" }}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
            >
              {isEditMode ? <><Pencil className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Add Invoice</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
