import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/hooks/useDataStore";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtMoney } from "@/lib/formatters";

export default function InvoicesPage() {
  const { invoices, projects } = useDataStore();
  const { toSGD } = useCurrency();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Date</th>
                <th className="text-right">Amount (Original)</th>
                <th className="text-right">Amount (SG$)</th>
                <th>Status</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const proj = projects.find(p => p.project_id === inv.project_id);
                const cur = proj?.currency || "SGD";
                return (
                  <tr key={inv.invoice_id}>
                    <td className="font-medium">{inv.invoice_no}</td>
                    <td className="text-muted-foreground">{proj?.project_name}</td>
                    <td>{inv.invoice_date}</td>
                    <td className="text-right tabular-nums mono font-medium">{fmtMoney(inv.amount_ex_tax, cur)}</td>
                    <td className="text-right tabular-nums mono font-medium">{fmtMoney(toSGD(inv.amount_ex_tax, cur), "SGD")}</td>
                    <td>
                      <Badge variant={inv.status === "Paid" ? "default" : "outline"} className="text-xs">{inv.status}</Badge>
                    </td>
                    <td className="text-muted-foreground">{inv.paid_date ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
