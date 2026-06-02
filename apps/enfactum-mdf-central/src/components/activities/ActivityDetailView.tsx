import { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Link as LinkIcon,
  Building2,
  Mail,
  History,
  User,
  Tag,
  ChevronsUpDown,
  Check,
  Briefcase,
  Lock,
  EyeOff,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Activity, ActivityStakeholder, ActivityTimeline, getDeadlineRisk, hasFinancialDeviation } from "@/types/database";
import { StatusBadgeV3, QuarterBadge, DeadlineRiskBadge } from "@/components/shared/StatusBadge";
import { POEChecklist } from "./POEChecklist";
import { ActivityVendorsSection } from "./ActivityVendorsSection";
import { supabase } from "@/integrations/supabase/client";
import { MARKETS, CURRENCIES, BUSINESS_UNITS, PBM_NAMES, ACTIVITY_STATUSES_V3 } from "@/lib/constants";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUpdateActivity, useDeleteActivity } from "@/hooks/useActivities";
import { toast } from "sonner";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityDetailViewProps {
  activity: Activity;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ActivityDetailView({ activity, onClose, onUpdate }: ActivityDetailViewProps) {
  const [stakeholders, setStakeholders] = useState<ActivityStakeholder[]>([]);
  const [timeline, setTimeline] = useState<ActivityTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  
  // Local state for editable fields
  const [selectedBUs, setSelectedBUs] = useState<string[]>(activity.bu_array || [activity.bu]);
  const [selectedPBMs, setSelectedPBMs] = useState<string[]>(activity.pbm_names || []);
  const [currentStatus, setCurrentStatus] = useState<string>(activity.status_v3 || 'Not Start');

  const { data: teamMembers = [] } = useTeamMembers();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const permissions = useCurrentUserPermissions();

  const handleDeleteActivity = async () => {
    try {
      await deleteActivity.mutateAsync(activity.id);
      onClose();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  useEffect(() => {
    fetchActivityDetails();
  }, [activity.id]);

  // Sync local state when activity changes
  useEffect(() => {
    setSelectedBUs(activity.bu_array || [activity.bu]);
    setSelectedPBMs(activity.pbm_names || []);
    setCurrentStatus(activity.status_v3 || 'Not Start');
  }, [activity]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    try {
      const [stakeholdersRes, timelineRes] = await Promise.all([
        supabase
          .from('activity_stakeholders')
          .select('*')
          .eq('activity_id', activity.id),
        supabase
          .from('activity_timeline')
          .select('*')
          .eq('activity_id', activity.id)
          .order('event_date', { ascending: false })
          .limit(10),
      ]);

      setStakeholders(stakeholdersRes.data || []);
      setTimeline(timelineRes.data || []);
    } catch (error) {
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeChange = async (teamMemberId: string) => {
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { assigned_to: teamMemberId } as any,
      });
      setAssigneeOpen(false);
      toast.success("Assignee updated");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating assignee:', error);
      toast.error("Failed to update assignee");
    }
  };

  const handleBUsChange = async (newBUs: string[]) => {
    setSelectedBUs(newBUs);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { 
          bu_array: newBUs,
          bu: newBUs[0] || 'PC Commercial' // Legacy field
        } as any,
      });
      toast.success("Business units updated");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating BUs:', error);
      toast.error("Failed to update business units");
    }
  };

  const handlePBMsChange = async (newPBMs: string[]) => {
    setSelectedPBMs(newPBMs);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { pbm_names: newPBMs } as any,
      });
      toast.success("PBM names updated");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating PBMs:', error);
      toast.error("Failed to update PBM names");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Logic gate: prevent changing to "Executing" without HP approval email
    if (newStatus === 'Executing' && !activity.hp_approval_email_url) {
      toast.error("Cannot move to Executing status without HP Approval Email URL");
      return;
    }

    setCurrentStatus(newStatus);
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        updates: { status_v3: newStatus } as any,
      });
      toast.success("Status updated");
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
      setCurrentStatus(activity.status_v3 || 'Not Start'); // Revert on error
    }
  };

  const marketLabel = MARKETS.find(m => m.value === activity.market)?.label || activity.market;
  const currencySymbol = CURRENCIES.find(c => c.value === activity.currency)?.symbol || '$';
  const deadline = activity.claim_deadline || activity.financials?.claim_deadline;
  const deadlineRisk = getDeadlineRisk(deadline);
  const daysUntilDeadline = deadline ? differenceInDays(new Date(deadline), new Date()) : null;
  
  const approvedBudget = activity.approved_budget || activity.financials?.approved_budget || 0;
  const actualCost = activity.financials?.actual_cost || 0;
  const showDeviation = hasFinancialDeviation(approvedBudget, actualCost);

  // Check if HP approval is required for Executing status
  const canExecute = activity.hp_approval_email_url !== null && activity.hp_approval_email_url !== undefined && activity.hp_approval_email_url !== '';
  const isPendingApproval = currentStatus === 'Planning' && !canExecute;

  const currentAssignee = activity.assigned_team_member || teamMembers.find(m => m.id === activity.assigned_to);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Split Panel */}
      <div className="relative ml-auto w-full max-w-5xl bg-background border-l border-border shadow-2xl flex animate-slide-in-right">
        {/* Left Panel - Metadata & Stakeholders */}
        <div className="w-[420px] border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {activity.activity_id}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                  {activity.name}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {/* Delete button - only shown if user has can_delete_activity permission */}
                {permissions.can_delete_activity && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{activity.name}"? This action cannot be undone and will remove all associated data including financials, stakeholders, and timeline events.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteActivity}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Activity Status (Single-select with logic gate) */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Activity Status</p>
                </div>
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_STATUSES_V3.map((status) => (
                      <SelectItem 
                        key={status.value} 
                        value={status.value}
                        disabled={status.value === 'Executing' && !canExecute}
                      >
                        <div className="flex items-center gap-2">
                          {status.label}
                          {status.value === 'Executing' && !canExecute && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* HP Approval Gate Warning */}
                {isPendingApproval && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        HP Approval Email required to move to Executing
                      </p>
                    </div>
                  </div>
                )}
                {canExecute && currentStatus === 'Planning' && (
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          HP Approval received - Ready to Execute
                        </p>
                        <a 
                          href={activity.hp_approval_email_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          View approval
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Type */}
              {activity.activity_type && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Activity Type</p>
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    {activity.activity_type}
                  </Badge>
                </div>
              )}

              {/* Business Units (Multi-select) */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Business Units</p>
                </div>
                <MultiSelect
                  options={BUSINESS_UNITS.map(bu => ({ value: bu.value, label: bu.label }))}
                  selected={selectedBUs}
                  onChange={handleBUsChange}
                  placeholder="Select business units..."
                />
              </div>

              {/* PBM Names (Multi-select) */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">PBM Names</p>
                </div>
                <MultiSelect
                  options={PBM_NAMES.map(pbm => ({ value: pbm.value, label: pbm.label }))}
                  selected={selectedPBMs}
                  onChange={handlePBMsChange}
                  placeholder="Select PBM names..."
                />
              </div>

              {/* Assigned To */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                </div>
                <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={assigneeOpen}
                      className="w-full justify-between"
                    >
                      {currentAssignee ? (
                        <span>{currentAssignee.full_name} - {currentAssignee.team}</span>
                      ) : (
                        <span className="text-muted-foreground">Select assignee</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search team member..." />
                      <CommandList>
                        <CommandEmpty>No team member found.</CommandEmpty>
                        <CommandGroup>
                          {teamMembers.map((member) => (
                            <CommandItem
                              key={member.id}
                              value={`${member.full_name} ${member.team}`}
                              onSelect={() => handleAssigneeChange(member.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  activity.assigned_to === member.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{member.full_name}</span>
                                <span className="text-xs text-muted-foreground">{member.team}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Market</p>
                  <p className="font-medium">{marketLabel}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Funding</p>
                  <p className="font-medium">{activity.funding_source}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Quarter</p>
                  <QuarterBadge quarter={activity.fiscal_quarter} />
                </div>
              </div>

              {/* Financial Section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Details
                  {!permissions.can_edit_budget && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="h-3 w-3 text-muted-foreground ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You don't have permission to edit budget</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Approved Budget</span>
                    <span className="font-semibold">{currencySymbol}{approvedBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Actual Cost</span>
                    <span className={cn(
                      "font-semibold",
                      showDeviation && "text-destructive"
                    )}>
                      {currencySymbol}{actualCost.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Internal Margin - Only visible to users with can_view_margin permission */}
                  {permissions.can_view_margin ? (
                    <div className="flex items-center justify-between py-2 border-t border-dashed border-border/50 pt-3">
                      <span className="text-sm text-muted-foreground">Internal Margin</span>
                      <span className="font-semibold text-success">
                        {currencySymbol}{(approvedBudget - actualCost).toLocaleString()}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({approvedBudget > 0 ? (((approvedBudget - actualCost) / approvedBudget) * 100).toFixed(1) : 0}%)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2 border-t border-dashed border-border/50 pt-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Internal Margin
                      </span>
                      <span className="text-sm text-muted-foreground italic">Hidden</span>
                    </div>
                  )}
                  
                  {showDeviation && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            Budget Deviation &gt;5%
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Financial deviation explanation required
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Timeline Section */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Execution Start</span>
                    <span className="text-sm">
                      {activity.execution_start_date 
                        ? format(new Date(activity.execution_start_date), 'MMM d, yyyy')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Execution End</span>
                    <span className="text-sm">
                      {activity.execution_end_date 
                        ? format(new Date(activity.execution_end_date), 'MMM d, yyyy')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Claim Deadline</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {deadline ? format(new Date(deadline), 'MMM d, yyyy') : '-'}
                      </span>
                      {daysUntilDeadline !== null && (
                        <DeadlineRiskBadge risk={deadlineRisk} daysRemaining={daysUntilDeadline} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stakeholders */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Stakeholders
                </h3>
                {stakeholders.length > 0 ? (
                  <div className="space-y-2">
                    {stakeholders.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {s.stakeholder_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.stakeholder_name}</p>
                          <p className="text-xs text-muted-foreground">{s.stakeholder_role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No stakeholders assigned</p>
                )}
              </div>

              <Separator />

              {/* Vendors Section */}
              <ActivityVendorsSection activityId={activity.id} onUpdate={onUpdate} />

              {/* Partner Info */}
              {activity.partner && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Partner
                    </h3>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{activity.partner.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.partner.type} • {activity.partner.market}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Documents & POE */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="poe" className="flex-1 flex flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent h-12 gap-4">
                <TabsTrigger value="poe" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <FileText className="h-4 w-4 mr-2" />
                  POE Checklist
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <History className="h-4 w-4 mr-2" />
                  Activity Log
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="poe" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <POEChecklist activityId={activity.id} activityType={activity.activity_type} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="documents" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            {index < timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm">{event.event_description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No activity logged yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}