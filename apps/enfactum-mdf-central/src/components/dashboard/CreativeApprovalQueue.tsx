import { useState, useEffect } from "react";
import { Palette, Clock, CheckCircle, AlertTriangle, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CreativeApproval } from "@/types/database";
import { PriorityBadge } from "@/components/shared/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CreativeApprovalQueueProps {
  onViewAll?: () => void;
}

export function CreativeApprovalQueue({ onViewAll }: CreativeApprovalQueueProps) {
  const [approvals, setApprovals] = useState<(CreativeApproval & { activity?: { name: string; activity_id: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('creative_approvals')
        .select(`
          *,
          activity:activities(name, activity_id)
        `)
        .eq('status', 'Pending Review')
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      setApprovals((data || []) as any);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await supabase
        .from('creative_approvals')
        .update({ status: 'Approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      fetchApprovals();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const statusIcons = {
    'Pending Review': <Clock className="h-4 w-4 text-amber-500" />,
    'Approved': <CheckCircle className="h-4 w-4 text-green-500" />,
    'Revision Requested': <AlertTriangle className="h-4 w-4 text-orange-500" />,
    'Rejected': <AlertTriangle className="h-4 w-4 text-red-500" />,
  };

  if (loading) {
    return (
      <div className="section-container p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Creative Approval Queue</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="section-container p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Creative Approval Queue</h3>
          {approvals.length > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {approvals.length}
            </Badge>
          )}
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onViewAll}>
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">Queue Clear!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No pending creative approvals
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {statusIcons[approval.status]}
                    <span className="font-medium text-sm truncate">{approval.asset_name}</span>
                    <PriorityBadge priority={approval.priority as any} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal">
                      {approval.asset_type}
                    </Badge>
                    {approval.activity && (
                      <span className="truncate">
                        {approval.activity.activity_id} • {approval.activity.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {approval.asset_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(approval.asset_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleApprove(approval.id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
