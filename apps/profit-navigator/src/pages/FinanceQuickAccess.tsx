import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDataStore } from "@/hooks/useDataStore";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { stakeholders } from "@/data/seedData";
import { useCurrency } from "@/hooks/useCurrency";
import { Receipt, FileText, Calculator } from "lucide-react";
import { PayoutSimulator } from "@/components/PayoutSimulator";

export default function FinanceQuickAccess() {
  const { invoices, projects } = useDataStore();
  const allData = useAllProjectFinancials();
  const { fmtCurrencyWithPrefix, fmtSGD, toSGD } = useCurrency();
  const passThroughProjects = allData.filter(d => d.project.commercial_model === "PARTNER_PASS_THROUGH");
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Quick Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-project view of all invoices and settlements</p>
        </div>
        <Button onClick={() => setSimulatorOpen(true)} className="gap-1.5">
          <Calculator className="h-4 w-4" /> Simulator
        </Button>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices"><Receipt className="h-3.5 w-3.5 mr-1.5" />All Invoices</TabsTrigger>
          <TabsTrigger value="settlements"><FileText className="h-3.5 w-3.5 mr-1.5" />All Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead className="sticky top-0 z-10">
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
                        <td className="text-right tabular-nums mono font-medium">{fmtCurrencyWithPrefix(inv.amount_ex_tax, cur)}</td>
                        <td className="text-right tabular-nums mono font-medium">{fmtSGD(toSGD(inv.amount_ex_tax, cur))}</td>
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
        </TabsContent>

        <TabsContent value="settlements">
          {passThroughProjects.length === 0 ? (
            <p className="text-muted-foreground">No pass-through projects.</p>
          ) : (
            <div className="grid gap-4">
              {passThroughProjects.map(({ project, financials }) => {
                const partner = stakeholders.find(s => s.stakeholder_id === project.external_partner_stakeholder_id);
                const cur = project.currency || "SGD";
                return (
                  <div key={project.project_id} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold">{project.project_name}</h3>
                      <Badge variant="outline" className="text-xs">Draft</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Partner: {partner?.stakeholder_name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground text-xs">Partner Revenue</span><div className="tabular-nums mono font-medium mt-0.5">{fmtCurrencyWithPrefix(financials.partnerRevenue ?? 0, cur)}</div></div>
                      <div><span className="text-muted-foreground text-xs">Flat Fee</span><div className="tabular-nums mono font-medium mt-0.5">{fmtCurrencyWithPrefix(financials.flatFeeAmount ?? 0, cur)}</div></div>
                      <div><span className="text-muted-foreground text-xs">Int. Recharge</span><div className="tabular-nums mono font-medium mt-0.5">{fmtCurrencyWithPrefix(financials.internalRechargeAmount ?? 0, cur)}</div></div>
                      <div><span className="text-muted-foreground text-xs">Net Payable</span><div className="tabular-nums mono font-bold mt-0.5">{fmtCurrencyWithPrefix(financials.partnerNetPayable ?? 0, cur)}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payout Simulator Full-Screen Dialog */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Payout Simulator
            </DialogTitle>
          </DialogHeader>
          <PayoutSimulator />
        </DialogContent>
      </Dialog>
    </div>
  );
}
