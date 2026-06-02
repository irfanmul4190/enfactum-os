import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivities, useUpdateActivity } from "@/hooks/useActivities";
import { Activity } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadgeV3, QuarterBadge } from "@/components/shared/StatusBadge";
import { POEChecklist } from "@/components/activities/POEChecklist";
import { ACTIVITY_TYPES, CURRENCIES, SPECIAL_POE_ACTIVITY_TYPES, ACTIVITY_STATUSES_V3 } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, FileText, AlertCircle, Tag, User, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function POE() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: activities = [], isLoading, refetch } = useActivities();
  const updateActivity = useUpdateActivity();

  // Filter activities that are in POE-relevant statuses (using v3 statuses)
  const poeActivities = activities.filter(activity => 
    ['Activity Completed', 'Claiming', 'POE Submitted', 'Payment Documentation'].includes(activity.status_v3 || '')
  );

  const filteredActivities = poeActivities.filter(activity => {
    const matchesSearch = 
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.activity_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || activity.activity_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  const isSpecialType = (type?: string) => {
    return type && SPECIAL_POE_ACTIVITY_TYPES.includes(type as any);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedActivity) return;
    
    try {
      await updateActivity.mutateAsync({
        id: selectedActivity.id,
        updates: { status_v3: newStatus } as any,
      });
      setSelectedActivity({ ...selectedActivity, status_v3: newStatus as any });
      refetch();
      toast.success("Status updated successfully");
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    }
  };

  if (selectedActivity) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedActivity(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-muted-foreground">
                  {selectedActivity.activity_id}
                </span>
                <StatusBadgeV3 status={selectedActivity.status_v3 || 'Not Start'} />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{selectedActivity.name}</h1>
            </div>
          </div>

          {/* Activity Context Card */}
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activity Details</h2>
              <QuarterBadge quarter={selectedActivity.fiscal_quarter} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Activity Type</p>
                {selectedActivity.activity_type ? (
                  <Badge 
                    variant={isSpecialType(selectedActivity.activity_type) ? "default" : "secondary"}
                    className={cn("text-xs", isSpecialType(selectedActivity.activity_type) && "bg-primary")}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {selectedActivity.activity_type}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select 
                  value={selectedActivity.status_v3 || 'Not Start'} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_STATUSES_V3.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">PBM Names</p>
                <div className="flex flex-wrap gap-1">
                  {selectedActivity.pbm_names && selectedActivity.pbm_names.length > 0 ? (
                    selectedActivity.pbm_names.map((pbm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {pbm}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No PBMs assigned</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Budget</p>
                <p className="text-sm font-medium">
                  {getCurrencySymbol(selectedActivity.currency)}
                  {selectedActivity.approved_budget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Special requirements notice */}
            {isSpecialType(selectedActivity.activity_type) && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Special POE Requirements</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This "{selectedActivity.activity_type}" activity has additional documentation requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* POE Checklist */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              POE Submission
            </h2>
            <POEChecklist 
              activityId={selectedActivity.id} 
              activityType={selectedActivity.activity_type}
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POE Submissions</h1>
            <p className="text-sm text-muted-foreground mt-1">Proof of Execution document management</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activities Table */}
        <div className="section-container">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>PBMs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow 
                    key={activity.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <TableCell className="font-mono text-sm">{activity.activity_id}</TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(activity.bu_array || [activity.bu]).join(', ')} • {activity.market}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.activity_type ? (
                        <Badge variant={isSpecialType(activity.activity_type) ? "default" : "outline"} className="text-xs whitespace-nowrap">
                          {activity.activity_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {activity.pbm_names && activity.pbm_names.length > 0 ? (
                          activity.pbm_names.slice(0, 2).map((pbm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{pbm}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        {activity.pbm_names && activity.pbm_names.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{activity.pbm_names.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadgeV3 status={activity.status_v3 || 'Not Start'} /></TableCell>
                    <TableCell className="text-right font-medium">
                      {getCurrencySymbol(activity.currency)}{activity.approved_budget.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold text-foreground">No activities ready for POE</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Activities in "Activity Completed", "Claiming", or "POE Submitted" status will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}