import React, { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle, CheckCircle2, Info, Plus, Trash2, AlertTriangle,
  ClipboardList, Copy, RotateCcw, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFxRate } from "@/contexts/FxRateContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import { useAccounts } from "@/hooks/useAccounts";
import { toast } from "sonner";
import type { Invoice } from "@/data/invoiceData";

// ─── Constants ────────────────────────────────────────────────────────────────
const GST_RATE = 0.09;
// Account and Account-Lead lists are loaded at runtime from the shared admin
// tables (see useAccounts / launcher /admin/accounts) — no longer hardcoded.
const COUNTRIES = ["Singapore","India","Malaysia","Indonesia","Others"];
const CURRENCIES = [
  { code: "SGD", label: "Sing$ (SGD)", symbol: "SGD" },
  { code: "USD", label: "US Dollar (USD)", symbol: "USD" },
  { code: "MYR", label: "Ringgit (MYR)", symbol: "MYR" },
  { code: "INR", label: "Indian Rupee (INR)", symbol: "INR" },
  { code: "OTH", label: "Other Currency", symbol: "OTH" },
] as const;

const REVENUE_TYPES = ["Consulting","Marketing Services","Impact","Manpower","Pass-Thru","Other"];
const MONTHS =["","January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  invoiceNumber:       z.string().trim().min(1,"Required").max(30).regex(/^[A-Za-z0-9\-]+$/,"Letters, numbers & hyphens only"),
  company:             z.string().trim().min(1,"Required").max(150),
  billedTo:            z.string().trim().min(1,"Required").max(150),
  date:                z.string().min(1,"Required"),
  dueDate:             z.string().optional(),
  account:             z.string().min(1,"Required"),
  accountLead:         z.string().min(1,"Required"),
  revenueType:         z.string().min(1,"Required"),
  country:             z.string().min(1,"Required"),
  currency:            z.string().min(1,"Required"),
  amountExTax:         z.string().min(1,"Required").refine(v => !isNaN(+v) && +v >= 0,"Must be ≥ 0").refine(v => +v <= 10_000_000,"Amount seems too large"),
  hasGST:              z.boolean(),
  isCreditNote:        z.boolean(),
  paymentReceivedMonth:z.string().max(20),
  poNumber:            z.string().trim().max(50),
  activityNumber:      z.string().trim().max(50),
  projectCode:         z.string().trim().max(50),
  remarks:             z.string().trim().max(300),
});
type FormValues = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FieldErr = React.forwardRef<HTMLParagraphElement, { msg?: string }>(({ msg }, _ref) => {
  if (!msg) return null;
  return <p className="flex items-center gap-1 mt-1 text-xs" style={{ color:"hsl(var(--negative))" }}><AlertCircle className="w-3 h-3 shrink-0" />{msg}</p>;
});
FieldErr.displayName = "FieldErr";

const FieldLabel = React.forwardRef<HTMLLabelElement, { children: React.ReactNode; required?: boolean }>(({ children, required }, _ref) => {
  return (
    <label ref={_ref} className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"hsl(var(--muted-foreground))" }}>
      {children}{required && <span className="ml-0.5" style={{ color:"hsl(var(--negative))" }}>*</span>}
    </label>
  );
});
FieldLabel.displayName = "FieldLabel";
const inp = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-1 focus:ring-primary";
const inpStyle = { background:"hsl(var(--surface-2))", borderColor:"hsl(var(--border))", color:"hsl(var(--foreground))" };

function deriveMonth(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { label: "", fy: "FY2025" };
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const label = `${M[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`;
  const fy = d.getMonth() >= 3 ? `FY${d.getFullYear()}` : `FY${d.getFullYear()-1}`;
  return { label, fy };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function InvoiceEntry() {
  const { usdToSgd } = useFxRate();
  const { invoices, addInvoices } = useInvoices();
  const { accounts, leads } = useAccounts();
  const accountNames = useMemo(() => accounts.filter(a => a.active).map(a => a.name), [accounts]);
  const leadNames = useMemo(() => leads.filter(l => l.active).map(l => l.name), [leads]);
  const [submitted, setSubmitted] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [sessionInvoices, setSessionInvoices] = useState<Invoice[]>([]);
  const allInvoiceNumbers = useMemo(
    () => new Set(invoices.map(i => i.invoiceNumber.toUpperCase())),
    [invoices],
  );
  // Local placeholder id for the session log only — the DB assigns the real
  // id on push (invoiceToRow strips it).
  let nextId = Date.now();

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      currency: "SGD", country: "Singapore", hasGST: true,
      isCreditNote: false, paymentReceivedMonth: "", poNumber: "", activityNumber: "",
      projectCode: "", remarks: "", amountExTax: "", revenueType: "",
    },
  });

  const w = watch();
  // Use useWatch for live calculation fields to guarantee re-renders
  const amountExTaxRaw = useWatch({ control, name: "amountExTax" });
  const hasgst = useWatch({ control, name: "hasGST" });
  const isCreditNote = useWatch({ control, name: "isCreditNote" });
  const currency = useWatch({ control, name: "currency" });
  const dateVal = useWatch({ control, name: "date" });

  const amtEx  = parseFloat(amountExTaxRaw) || 0;
  const gstAmt = hasgst && !isCreditNote ? amtEx * GST_RATE : 0;
  const amtWith = amtEx + gstAmt;
  const totalSGD = currency === "USD" ? amtWith * usdToSgd : isCreditNote ? 0 : amtWith;
  const { label: monthLabel, fy: fiscalYear } = dateVal ? deriveMonth(dateVal) : { label: "", fy: "FY2025" };

  // Auto due date from account payment terms
  useEffect(() => {
    if (!w.date || !w.account) return;
    const days = accounts.find(a => a.name === w.account)?.default_payment_terms_days ?? 30;
    setValue("dueDate", addDays(w.date, days));
  }, [w.date, w.account, accounts, setValue]);

  // Duplicate detection
  const isDuplicate = w.invoiceNumber
    ? allInvoiceNumbers.has(w.invoiceNumber.toUpperCase()) ||
      sessionInvoices.some(i => i.invoiceNumber === w.invoiceNumber.toUpperCase())
    : false;

  function onSubmit(data: FormValues) {
    const isUSD = data.currency === "USD";
    const amt   = parseFloat(data.amountExTax);
    const gst   = data.hasGST && !data.isCreditNote ? amt * GST_RATE : 0;
    const withT = amt + gst;
    const sgdT  = isUSD ? withT * usdToSgd : data.isCreditNote ? 0 : withT;

    const inv: Invoice = {
      id: nextId++,
      invoiceNumber: data.invoiceNumber.toUpperCase(),
      company: data.company.trim(),
      billedTo: data.billedTo.trim(),
      date: data.date,
      month: monthLabel,
      fiscalYear,
      accountLead: data.accountLead,
      account: data.account,
      currency: isUSD ? "USD" : "SGD",
      country: data.country,
      revenueType: data.revenueType,
      hasGST: data.hasGST,
      totalBillingSGD: sgdT,
      amountSGDExTax: !isUSD ? amt : null,
      amountSGDWithTax: !isUSD ? withT : null,
      amountUSDExTax: isUSD ? amt : null,
      amountUSDWithTax: isUSD ? withT : null,
      amountSGDConverted: isUSD ? sgdT : null,
      paymentReceivedMonth: data.paymentReceivedMonth || null,
      remarks: data.isCreditNote
        ? "Credit Note"
        : [data.remarks, data.poNumber ? `PO: ${data.poNumber}` : "", data.activityNumber ? `Act: ${data.activityNumber}` : "", data.projectCode ? `Proj: ${data.projectCode}` : ""].filter(Boolean).join(" | "),
    };

    setSessionInvoices(prev => [inv, ...prev]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    // Keep country/currency/lead, reset rest
    const { country, currency, accountLead } = data;
    reset({ currency, country, accountLead, hasGST: true, isCreditNote: false, paymentReceivedMonth: "", poNumber: "", activityNumber: "", projectCode: "", remarks: "", amountExTax: "", revenueType: "" });
  }

  const paymentTermDays = accounts.find(a => a.name === w.account)?.default_payment_terms_days ?? 30;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:"hsl(var(--foreground))" }}>Invoice Entry Sheet</h1>
          <p className="text-sm mt-1" style={{ color:"hsl(var(--muted-foreground))" }}>
            Comprehensive entry form · GST auto-calc · FX conversion · duplicate detection
          </p>
        </div>
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ background:"hsl(var(--positive) / 0.1)", borderColor:"hsl(var(--positive) / 0.3)" }}>
            <CheckCircle2 className="w-4 h-4" style={{ color:"hsl(var(--positive))" }} />
            <span className="text-sm font-semibold" style={{ color:"hsl(var(--positive))" }}>Invoice saved to session!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Main Form ──────────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Section 1: Geography + Currency */}
          <div className="kpi-card">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>① Origin & Currency</div>

            <div className="mb-4">
              <FieldLabel required>Country / Region</FieldLabel>
              <div className="grid grid-cols-5 gap-1.5 rounded-xl overflow-hidden border" style={{ borderColor:"hsl(var(--border))" }}>
                {COUNTRIES.map(c => (
                  <button key={c} type="button" onClick={() => setValue("country", c, { shouldValidate: true })}
                    className="py-2.5 text-xs font-semibold transition-all"
                    style={w.country === c
                      ? { background:"hsl(var(--primary))", color:"hsl(var(--primary-foreground))" }
                      : { background:"hsl(var(--surface-2))", color:"hsl(var(--muted-foreground))" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>Invoice Currency</FieldLabel>
              <div className="grid grid-cols-5 gap-1.5">
                {CURRENCIES.map(cur => (
                  <button key={cur.code} type="button" onClick={() => setValue("currency", cur.code)}
                    className="py-2.5 px-1 rounded-lg text-xs font-semibold border transition-all"
                    style={w.currency === cur.code
                      ? { background:"hsl(var(--primary))", color:"hsl(var(--primary-foreground))", borderColor:"hsl(var(--primary))" }
                      : { background:"hsl(var(--surface-2))", color:"hsl(var(--muted-foreground))", borderColor:"hsl(var(--border))" }}>
                    {cur.label.split(" ")[0]}
                  </button>
                ))}
              </div>
              {w.currency === "USD" && (
                <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg" style={{ background:"hsl(var(--warning-muted))" }}>
                  <Info className="w-3 h-3 shrink-0" style={{ color:"hsl(var(--warning))" }} />
                  <span className="text-xs" style={{ color:"hsl(var(--warning))" }}>FX rate: 1 USD = {usdToSgd.toFixed(4)} SGD (adjustable in sidebar)</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Invoice Identity */}
          <div className="kpi-card">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>② Invoice Details</div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <FieldLabel required>Invoice Number</FieldLabel>
                <input {...register("invoiceNumber")} placeholder="ENF25050"
                  className={cn(inp, isDuplicate && "border-orange-400/70", errors.invoiceNumber && "border-red-400/70")}
                  style={inpStyle} maxLength={30} />
                {isDuplicate && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color:"hsl(var(--warning))" }}>
                    <AlertTriangle className="w-3 h-3 shrink-0" />Duplicate — this number already exists
                  </p>
                )}
                <FieldErr msg={errors.invoiceNumber?.message} />
              </div>
              <div>
                <FieldLabel required>Invoice Date</FieldLabel>
                <input {...register("date")} type="date"
                  className={cn(inp, errors.date && "border-red-400/70")} style={inpStyle} />
                {monthLabel && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color:"hsl(var(--primary))" }}>
                    <Info className="w-3 h-3 shrink-0" />Month: {monthLabel} · {fiscalYear}
                  </p>
                )}
                <FieldErr msg={errors.date?.message} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <FieldLabel>PO Number</FieldLabel>
                <input {...register("poNumber")} placeholder="PO-2025-0123"
                  className={inp} style={inpStyle} maxLength={50} />
              </div>
              <div>
                <FieldLabel>Activity Number</FieldLabel>
                <input {...register("activityNumber")} placeholder="ACT-001"
                  className={inp} style={inpStyle} maxLength={50} />
              </div>
              <div>
                <FieldLabel>Project / Cost Code</FieldLabel>
                <input {...register("projectCode")} placeholder="PROJ-HP-001"
                  className={inp} style={inpStyle} maxLength={50} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Company Name</FieldLabel>
                <input {...register("company")} placeholder="HP PPS Asia Pacific Pte. Ltd"
                  className={cn(inp, errors.company && "border-red-400/70")} style={inpStyle} maxLength={150} />
                <FieldErr msg={errors.company?.message} />
              </div>
              <div>
                <FieldLabel required>Billed To (Contact)</FieldLabel>
                <input {...register("billedTo")} placeholder="Chiu Chun Min"
                  className={cn(inp, errors.billedTo && "border-red-400/70")} style={inpStyle} maxLength={150} />
                <FieldErr msg={errors.billedTo?.message} />
              </div>
            </div>
          </div>

          {/* Section 3: Account Mapping */}
          <div className="kpi-card">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>③ Account Mapping</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel required>Account</FieldLabel>
                <select {...register("account")} className={cn(inp, errors.account && "border-red-400/70")} style={inpStyle}>
                  <option value="">Select…</option>
                  {accountNames.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {w.account && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color:"hsl(var(--warning))" }}>
                    <Info className="w-3 h-3 shrink-0" />{w.account} payment terms: {paymentTermDays}d
                  </p>
                )}
                <FieldErr msg={errors.account?.message} />
              </div>
              <div>
                <FieldLabel required>Account Lead</FieldLabel>
                <select {...register("accountLead")} className={cn(inp, errors.accountLead && "border-red-400/70")} style={inpStyle}>
                  <option value="">Select…</option>
                  {leadNames.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <FieldErr msg={errors.accountLead?.message} />
              </div>
              <div>
                <FieldLabel required>Revenue Type</FieldLabel>
                <select {...register("revenueType")} className={cn(inp, errors.revenueType && "border-red-400/70")} style={inpStyle}>
                  <option value="">Select…</option>
                  {REVENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <FieldErr msg={errors.revenueType?.message} />
              </div>
            </div>
          </div>

          {/* Section 4: Financials */}
          <div className="kpi-card">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>④ Financial Details</div>

            <div className="mb-4">
              <FieldLabel required>Amount Ex-Tax ({w.currency})</FieldLabel>
              <input {...register("amountExTax")} type="number" step="0.01" min="0" placeholder="0.00"
                className={cn(inp, "mono text-base font-semibold", errors.amountExTax && "border-red-400/70")} style={inpStyle} />
              <FieldErr msg={errors.amountExTax?.message} />
            </div>

            {/* GST + Credit Note toggles */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button type="button" onClick={() => setValue("hasGST", !w.hasGST)}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{ background: w.hasGST ? "hsl(var(--positive) / 0.1)" : "hsl(var(--surface-2))", borderColor: w.hasGST ? "hsl(var(--positive) / 0.4)" : "hsl(var(--border))" }}>
                <div className="w-10 h-6 rounded-full relative shrink-0" style={{ background: w.hasGST ? "hsl(var(--positive))" : "hsl(var(--surface-4))" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: w.hasGST ? "22px" : "4px" }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color:"hsl(var(--foreground))" }}>GST Applicable (9%)</div>
                  <div className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>
                    {w.hasGST && amtEx > 0 ? `+${w.currency} ${gstAmt.toLocaleString("en-SG",{minimumFractionDigits:2})} GST` : "Toggle to apply GST"}
                  </div>
                </div>
              </button>

              <button type="button" onClick={() => setValue("isCreditNote", !w.isCreditNote)}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{ background: w.isCreditNote ? "hsl(var(--negative) / 0.1)" : "hsl(var(--surface-2))", borderColor: w.isCreditNote ? "hsl(var(--negative) / 0.4)" : "hsl(var(--border))" }}>
                <div className="w-10 h-6 rounded-full relative shrink-0" style={{ background: w.isCreditNote ? "hsl(var(--negative))" : "hsl(var(--surface-4))" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: w.isCreditNote ? "22px" : "4px" }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color:"hsl(var(--foreground))" }}>Credit Note</div>
                  <div className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>Billing value = SGD 0</div>
                </div>
              </button>
            </div>

            {/* Due date + Payment status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Due Date <span className="normal-case font-normal text-xs ml-1" style={{ color:"hsl(var(--muted-foreground))" }}>(auto: {paymentTermDays}d terms)</span></FieldLabel>
                <input {...register("dueDate")} type="date" className={inp} style={inpStyle} />
              </div>
              <div>
                <FieldLabel>Payment Received Month</FieldLabel>
                <select {...register("paymentReceivedMonth")} className={inp} style={inpStyle}>
                  {MONTHS.map(m => <option key={m} value={m}>{m || "— Pending —"}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div className="kpi-card">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>⑤ Notes & Remarks</div>
            <textarea {...register("remarks")} rows={3} placeholder="e.g. Milestone 2 delivery, HP Partner discount applied, deferred billing…"
              className={cn(inp, "resize-none")} style={inpStyle} maxLength={300} />
            <div className="text-right text-xs mt-1" style={{ color:"hsl(var(--muted-foreground))" }}>{(w.remarks || "").length}/300</div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit(onSubmit)}
            className="btn-primary w-full py-3.5 justify-center text-sm font-bold tracking-wide">
            <Plus className="w-4 h-4" /> Save Invoice to Session
          </button>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Live Calculation */}
          <div className="kpi-card sticky top-6">
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color:"hsl(var(--primary))" }}>
              <FileCheck className="w-3.5 h-3.5 inline mr-1.5" />Live Calculation
            </div>

            {amtEx > 0 ? (
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span style={{ color:"hsl(var(--muted-foreground))" }}>Amount Ex-Tax</span>
                  <span className="mono font-semibold" style={{ color:"hsl(var(--foreground))" }}>{currency} {amtEx.toLocaleString("en-SG",{minimumFractionDigits:2})}</span>
                </div>
                {hasgst && !isCreditNote && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color:"hsl(var(--muted-foreground))" }}>GST (9%)</span>
                    <span className="mono stat-positive">+{currency} {gstAmt.toLocaleString("en-SG",{minimumFractionDigits:2})}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t pt-2" style={{ borderColor:"hsl(var(--border))" }}>
                  <span style={{ color:"hsl(var(--foreground))" }}>With Tax</span>
                  <span className="mono font-semibold" style={{ color:"hsl(var(--foreground))" }}>{currency} {amtWith.toLocaleString("en-SG",{minimumFractionDigits:2})}</span>
                </div>
                {currency === "USD" && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color:"hsl(var(--primary))" }}>SGD Equiv (×{usdToSgd.toFixed(4)})</span>
                    <span className="mono font-bold" style={{ color:"hsl(var(--primary))" }}>SGD {(amtWith * usdToSgd).toLocaleString("en-SG",{minimumFractionDigits:2})}</span>
                  </div>
                )}
                {isCreditNote && (
                  <div className="flex justify-between text-sm font-bold" style={{ color:"hsl(var(--negative))" }}>
                    <span>Total Billing</span><span className="mono">SGD 0.00</span>
                  </div>
                )}

                {/* Big total */}
                <div className="mt-3 p-3 rounded-xl text-center" style={{ background:"hsl(var(--primary) / 0.08)" }}>
                  <div className="text-xs mb-1" style={{ color:"hsl(var(--muted-foreground))" }}>Total Billing SGD</div>
                  <div className="text-2xl font-bold mono" style={{ color:"hsl(var(--primary))" }}>
                    {isCreditNote ? "0.00" : totalSGD.toLocaleString("en-SG",{minimumFractionDigits:2})}
                  </div>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {monthLabel && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:"hsl(var(--surface-3))", color:"hsl(var(--muted-foreground))" }}>{monthLabel} · {fiscalYear}</span>}
                  {w.account && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:"hsl(var(--surface-3))", color:"hsl(var(--muted-foreground))" }}>{w.account}</span>}
                  {w.revenueType && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:"hsl(var(--surface-3))", color:"hsl(var(--muted-foreground))" }}>{w.revenueType}</span>}
                  {w.country && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background:"hsl(var(--surface-3))", color:"hsl(var(--muted-foreground))" }}>{w.country}</span>}
                </div>
              </div>
            ) : (
              <div className="text-center py-8" style={{ color:"hsl(var(--muted-foreground))" }}>
                <div className="text-3xl mb-2">🧮</div>
                <div className="text-xs">Enter an amount to see live calculation</div>
              </div>
            )}

            {/* Duplicate warning */}
            {isDuplicate && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background:"hsl(var(--warning-muted))" }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:"hsl(var(--warning))" }} />
                <div className="text-xs" style={{ color:"hsl(var(--warning))" }}>
                  <span className="font-semibold">Duplicate detected.</span> Invoice #{w.invoiceNumber?.toUpperCase()} already exists in the system.
                </div>
              </div>
            )}
          </div>

          {/* Session Log */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color:"hsl(var(--primary))" }}>
                <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />Session Log ({sessionInvoices.length})
              </div>
              {sessionInvoices.length > 0 && (
                <button onClick={() => setSessionInvoices([])} className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color:"hsl(var(--muted-foreground))" }}>
                  <RotateCcw className="w-3 h-3" />Clear
                </button>
              )}
            </div>

            {sessionInvoices.length === 0 ? (
              <div className="text-center py-6" style={{ color:"hsl(var(--muted-foreground))" }}>
                <div className="text-2xl mb-1">📋</div>
                <div className="text-xs">Saved invoices will appear here</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sessionInvoices.map((inv, i) => (
                  <div key={i} className="rounded-lg p-2.5 border" style={{ background:"hsl(var(--surface-2))", borderColor:"hsl(var(--border))" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold mono truncate" style={{ color:"hsl(var(--foreground))" }}>{inv.invoiceNumber}</div>
                        <div className="text-xs truncate mt-0.5" style={{ color:"hsl(var(--muted-foreground))" }}>{inv.company}</div>
                        <div className="text-xs mt-0.5" style={{ color:"hsl(var(--muted-foreground))" }}>{inv.account} · {inv.accountLead}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold mono" style={{ color:"hsl(var(--positive))" }}>
                          SGD {inv.totalBillingSGD.toLocaleString("en-SG",{minimumFractionDigits:0,maximumFractionDigits:0})}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color:"hsl(var(--muted-foreground))" }}>{inv.month}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background:"hsl(var(--surface-3))", color:"hsl(var(--muted-foreground))" }}>{inv.currency}</span>
                      {inv.hasGST && <span className="px-1.5 py-0.5 rounded text-xs" style={{ background:"hsl(var(--positive) / 0.15)", color:"hsl(var(--positive))" }}>GST</span>}
                      <button onClick={() => setSessionInvoices(p => p.filter((_, j) => j !== i))}
                        className="ml-auto p-1 rounded hover:bg-secondary transition-colors" title="Remove">
                        <Trash2 className="w-3 h-3" style={{ color:"hsl(var(--negative))" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Session total + Push button */}
            {sessionInvoices.length > 0 && (
              <>
                <div className="mt-3 pt-3 border-t flex justify-between text-sm font-semibold" style={{ borderColor:"hsl(var(--border))" }}>
                  <span style={{ color:"hsl(var(--muted-foreground))" }}>Session Total</span>
                  <span className="mono" style={{ color:"hsl(var(--primary))" }}>
                    SGD {sessionInvoices.reduce((s,i)=>s+i.totalBillingSGD,0).toLocaleString("en-SG",{minimumFractionDigits:0})}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await addInvoices(sessionInvoices);
                      setSessionInvoices([]);
                      setPushed(true);
                      setTimeout(() => setPushed(false), 3000);
                    } catch (e: any) {
                      toast.error(e?.message ?? "Could not push invoices to the tracker.");
                    }
                  }}
                  className="btn-primary mt-3 w-full justify-center py-2.5"
                >
                  {pushed
                    ? <><CheckCircle2 className="w-4 h-4" /> Pushed to Invoice Tracker!</>
                    : <><Copy className="w-4 h-4" /> Push {sessionInvoices.length} Invoice{sessionInvoices.length > 1 ? "s" : ""} to Tracker</>
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
