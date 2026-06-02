import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/hooks/useDataStore";
import { useAllProjectFinancials } from "@/hooks/useProjectFinancials";
import { calculateAllClientHealth, getTierColor } from "@/lib/clientHealth";
import type { ClientHealthResult } from "@/lib/clientHealth";
import ClientFormDialog from "@/components/forms/ClientFormDialog";
import type { Client } from "@/data/types";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, invoices } = useDataStore();
  const allProjectData = useAllProjectFinancials();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [showAtRiskFirst, setShowAtRiskFirst] = useState(false);

  const healthScores = useMemo(
    () => calculateAllClientHealth(clients, allProjectData, invoices),
    [clients, allProjectData, invoices]
  );

  const healthMap = useMemo(() => {
    const map: Record<string, ClientHealthResult> = {};
    healthScores.forEach(h => { map[h.clientId] = h; });
    return map;
  }, [healthScores]);

  const sortedClients = useMemo(() => {
    if (!showAtRiskFirst) return clients;
    return [...clients].sort((a, b) => {
      const scoreA = healthMap[a.client_id]?.score ?? 50;
      const scoreB = healthMap[b.client_id]?.score ?? 50;
      return scoreA - scoreB; // lower score first
    });
  }, [clients, healthMap, showAtRiskFirst]);

  async function handleSave(data: Omit<Client, "client_id">) {
    if (editing) {
      await updateClient(editing.client_id, data);
    } else {
      await addClient(data);
    }
  }

  function handleEdit(c: Client) {
    setEditing(c);
    setDialogOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function handleDelete(c: Client) {
    try {
      await deleteClient(c.client_id);
      toast({ title: "Client deleted" });
    } catch (e: any) {
      toast({
        title: "Could not delete client",
        description: e?.message ?? String(e),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">On-board Clients</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showAtRiskFirst ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setShowAtRiskFirst(prev => !prev)}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {showAtRiskFirst ? "Showing At Risk First" : "Show At Risk First"}
          </Button>
          <button className="btn-primary" onClick={handleNew}><Plus className="h-4 w-4" />On-board Client</button>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Health</th>
                <th>Country</th>
                <th>Industry</th>
                <th>Currency</th>
                <th>Payment Terms</th>
                <th>Tax Treatment</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map(c => {
                const health = healthMap[c.client_id];
                const tierColor = health ? getTierColor(health.tier) : "hsl(var(--muted-foreground))";
                return (
                  <tr key={c.client_id}>
                    <td className="font-medium">
                      <span className="flex items-center gap-2">
                        {health && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: tierColor }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs space-y-1">
                              <p className="font-bold">{health.tier} — Score: {health.score}/100</p>
                              <p>Payment: {health.breakdown.paymentVelocity}/30</p>
                              <p>Margin Trend: {health.breakdown.marginTrend}/30</p>
                              <p>Revenue Growth: {health.breakdown.revenueGrowth}/20</p>
                              <p>Recurrence: {health.breakdown.recurrence}/20</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {c.client_name}
                      </span>
                    </td>
                    <td>
                      {health && (
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold")}
                          style={{ borderColor: tierColor, color: tierColor }}
                        >
                          {health.tier}
                        </Badge>
                      )}
                    </td>
                    <td className="text-muted-foreground">{c.country}</td>
                    <td><Badge variant="secondary" className="text-xs">{c.industry}</Badge></td>
                    <td>{c.billing_currency}</td>
                    <td>{c.payment_terms}</td>
                    <td>{c.tax_treatment}</td>
                    <td className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} onSave={handleSave} />
    </div>
  );
}
