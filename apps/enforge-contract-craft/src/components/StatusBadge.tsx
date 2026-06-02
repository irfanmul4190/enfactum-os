import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-muted" },
  internal_review: { label: "Internal Review", className: "bg-warning/15 text-warning border-warning/30" },
  sent_to_client: { label: "Sent to Client", className: "bg-primary/15 text-primary border-primary/30" },
  client_review: { label: "Client Review", className: "bg-primary/15 text-primary border-primary/30" },
  negotiation: { label: "Negotiation", className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "Approved", className: "bg-success/15 text-success border-success/30" },
  signed: { label: "Signed", className: "bg-success/15 text-success border-success/30" },
  active: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  expired: { label: "Expired", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
