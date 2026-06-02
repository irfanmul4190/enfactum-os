import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Filter, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreativeApproval } from "@/types/database";
import { PriorityBadge } from "@/components/shared/StatusBadge";
import { CREATIVE_ASSET_TYPES, PRIORITY_LEVELS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Creatives() {
  const [approvals, setApprovals] = useState<(CreativeApproval & { activity?: { name: string; activity_id: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<CreativeApproval | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('creative_approvals')
        .select(`
          *,
          activity:activities(name, activity_id)
        `)
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApprovals((data || []) as any);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string, notes?: string) => {
    try {
      await supabase
        .from('creative_approvals')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          revision_notes: notes || null
        })
        .eq('id', id);
      
      toast.success(`Asset ${status.toLowerCase()}`);
      fetchApprovals();
      setSelectedApproval(null);
      setRevisionNotes('');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const statusConfigs = {
    'Pending Review': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    'Approved': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    'Revision Requested': { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    'Rejected': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  };

  const filteredApprovals = approvals.filter(a => 
    a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.activity?.activity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.activity?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = approvals.filter(a => a.status === 'Pending Review').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creative Approval Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve creative assets for MDF activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets or activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending Review">Pending Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Revision Requested">Revision Requested</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue */}
        <div className="section-container">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">No approvals found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter !== 'all' ? 'Try changing your filters' : 'Queue is empty'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredApprovals.map((approval) => {
                const StatusIcon = statusConfigs[approval.status as keyof typeof statusConfigs]?.icon || Clock;
                const statusColor = statusConfigs[approval.status as keyof typeof statusConfigs]?.color || 'text-muted-foreground';

                return (
                  <div key={approval.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        statusConfigs[approval.status as keyof typeof statusConfigs]?.bg
                      )}>
                        <StatusIcon className={cn("h-5 w-5", statusColor)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{approval.asset_name}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {approval.asset_type}
                          </Badge>
                          <PriorityBadge priority={approval.priority as any} />
                        </div>
                        
                        {approval.activity && (
                          <p className="text-sm text-muted-foreground">
                            {approval.activity.activity_id} • {approval.activity.name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Submitted {formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true })}</span>
                          {approval.reviewed_at && (
                            <span>Reviewed {formatDistanceToNow(new Date(approval.reviewed_at), { addSuffix: true })}</span>
                          )}
                        </div>

                        {approval.revision_notes && (
                          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/10 rounded text-sm">
                            <span className="font-medium text-orange-700 dark:text-orange-400">Revision Notes: </span>
                            <span className="text-orange-600 dark:text-orange-300">{approval.revision_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {approval.asset_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(approval.asset_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        
                        {approval.status === 'Pending Review' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleStatusChange(approval.id, 'Approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => setSelectedApproval(approval)}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Revise
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Request Revision</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label>Revision Notes</Label>
                                    <Textarea
                                      placeholder="Explain what changes are needed..."
                                      value={revisionNotes}
                                      onChange={(e) => setRevisionNotes(e.target.value)}
                                      className="mt-1.5"
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setRevisionNotes('')}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleStatusChange(approval.id, 'Revision Requested', revisionNotes)}
                                      disabled={!revisionNotes.trim()}
                                    >
                                      Request Revision
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleStatusChange(approval.id, 'Rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
