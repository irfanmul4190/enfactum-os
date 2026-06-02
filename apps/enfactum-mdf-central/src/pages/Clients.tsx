import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useActivities } from "@/hooks/useActivities";
import { CreateClientModal } from "@/components/clients/CreateClientModal";
import { ClientDetailSheet } from "@/components/clients/ClientDetailSheet";
import type { Client } from "@/types/database";

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: activities = [] } = useActivities();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Count activities per client by FK, not by name-prefix heuristic.
  const getClientActivityCount = (client: Client) =>
    activities.filter((a) => a.client_id === client.id).length;

  const getClientBudget = (client: Client) =>
    activities
      .filter((a) => a.client_id === client.id)
      .reduce((sum, a) => sum + (a.approved_budget || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your funding clients and their activity portfolios
            </p>
          </div>
          <CreateClientModal />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="section-container p-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No clients yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first client to start tracking activities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const activityCount = getClientActivityCount(client);
              const totalBudget = getClientBudget(client);

              return (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedClient(client)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{client.market}</p>
                        </div>
                      </div>
                      {client.is_active ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {client.funding_source && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Funding Source</span>
                          <Badge variant="outline">{client.funding_source}</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Activities</span>
                        <span className="font-medium">{activityCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Budget</span>
                        <span className="font-medium">
                          ${totalBudget.toLocaleString()}
                        </span>
                      </div>
                      {client.contract_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(client.contract_url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Contract
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Client Detail Sheet */}
        <ClientDetailSheet
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => !open && setSelectedClient(null)}
        />
      </div>
    </AppLayout>
  );
}
