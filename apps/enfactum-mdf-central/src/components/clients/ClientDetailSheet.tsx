import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  MapPin, 
  Calendar,
  CheckCircle2,
  XCircle,
  Pencil,
  ExternalLink,
  DollarSign,
  FolderKanban
} from "lucide-react";
import type { Client } from "@/types/database";
import { format } from "date-fns";
import { useActivities } from "@/hooks/useActivities";

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailSheet({ client, open, onOpenChange }: ClientDetailSheetProps) {
  const { data: activities = [] } = useActivities();

  if (!client) return null;

  // Get activities linked to this client by funding source
  const clientActivities = activities.filter(
    (a) => a.funding_source?.toLowerCase() === client.name.toLowerCase().split(' ')[0]
  );

  const totalBudget = clientActivities.reduce((sum, a) => sum + (a.approved_budget || 0), 0);
  const activeActivities = clientActivities.filter(
    (a) => !['Paid', 'Completed', 'Activity Completed'].includes(a.status_v3 || a.status)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
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
                <SheetTitle className="text-left">{client.name}</SheetTitle>
                {client.funding_source && (
                  <Badge variant="outline" className="mt-1">{client.funding_source}</Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
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

          <Separator />

          {/* Key Metrics */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Portfolio Overview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderKanban className="h-4 w-4" />
                  <span className="text-xs">Total Activities</span>
                </div>
                <p className="text-2xl font-bold">{clientActivities.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Total Budget</span>
                </div>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.market}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Activities</span>
                <span className="font-medium">{activeActivities.length}</span>
              </div>
            </div>
          </div>

          {client.contract_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Documents</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(client.contract_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Record Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(client.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(client.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button variant="outline" className="w-full">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
