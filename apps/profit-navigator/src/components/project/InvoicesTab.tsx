import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/lib/formatters";
import { CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import type { Invoice } from "@/data/types";

interface Props {
  invoices: Invoice[];
  currency: string;
  isForeign: boolean;
  toSGD: (amount: number, cur: string) => number;
}

export function InvoicesTab({ invoices, currency, isForeign, toSGD }: Props) {
  const cur = currency;
  const prefix = CURRENCY_SYMBOLS[cur] || cur;
  const fmt = (amount: number) => fmtMoney(amount, cur);
  const fmtSGDVal = (amount: number) => fmtMoney(amount, "SGD");
  const fmtNorm = (amount: number) => fmtSGDVal(toSGD(amount, cur));

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <h3 className="text-base font-semibold">Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="px-4 py-6 text-center text-muted-foreground">No invoices for this project.</p>
        ) : (
          <table className="w-full data-table">
            <thead className="sticky top-0 z-10">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th className="text-right">Amount ({prefix})</th>
                {isForeign && <th className="text-right">Amount (SG$)</th>}
                <th>Status</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_id}>
                  <td className="font-medium">{inv.invoice_no}</td>
                  <td className="text-muted-foreground">{inv.invoice_date}</td>
                  <td className="text-right tabular-nums mono">{fmt(inv.amount_ex_tax)}</td>
                  {isForeign && <td className="text-right tabular-nums mono">{fmtNorm(inv.amount_ex_tax)}</td>}
                  <td><Badge variant={inv.status === "Paid" ? "default" : "outline"} className="text-xs">{inv.status}</Badge></td>
                  <td className="text-muted-foreground">{inv.paid_date ?? "—"}</td>
                </tr>
              ))}
              <tr style={{ background: "hsl(var(--surface-3))" }}>
                <td colSpan={2} className="text-right font-bold">Total (SG$ normalized)</td>
                <td className="text-right tabular-nums mono font-bold">{fmt(invoices.reduce((s, i) => s + i.amount_ex_tax, 0))}</td>
                {isForeign && <td className="text-right tabular-nums mono font-bold">{fmtSGDVal(invoices.reduce((s, i) => s + toSGD(i.amount_ex_tax, cur), 0))}</td>}
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
