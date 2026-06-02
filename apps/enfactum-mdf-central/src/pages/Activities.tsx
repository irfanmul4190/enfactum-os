import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivities, useUpdateActivity } from "@/hooks/useActivities";
import { CreateActivityModal } from "@/components/activities/CreateActivityModal";
import { QuarterFilter } from "@/components/activities/QuarterFilter";
import { ActivityDetailView } from "@/components/activities/ActivityDetailView";
import { Activity } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, StatusBadgeV3, QuarterBadge } from "@/components/shared/StatusBadge";
import { ACTIVITY_TYPES, CURRENCIES, getCurrentHPQuarter, ACTIVITY_STATUSES_V3 } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Activities() {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [fiscalYear, setFiscalYear] = useState<number>(getCurrentHPQuarter().year);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: activities = [], isLoading, refetch } = useActivities(selectedQuarter);
  const updateActivity = useUpdateActivity();

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.activity_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || activity.activity_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getCurrencySymbol = (currency: string) => {
    return CURRENCIES.find(c => c.value === currency)?.symbol || '$';
  };

  const handleStatusChange = async (activityId: string, newStatus: string, hpApprovalUrl?: string) => {
    // Logic gate: prevent changing to "Executing" without HP approval email
    if (newStatus === 'Executing' && !hpApprovalUrl) {
      toast.error("Cannot move to Executing status without HP Approval Email URL");
      return;
    }

    try {
      await updateActivity.mutateAsync({
        id: activityId,
        updates: { status_v3: newStatus } as any,
      });
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all MDF activities across markets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <QuarterFilter 
              value={selectedQuarter}
              onValueChange={setSelectedQuarter}
              fiscalYear={fiscalYear}
              onFiscalYearChange={setFiscalYear}
            />
            <CreateActivityModal onSuccess={refetch} />
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
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activities Table */}
        <div className="section-container">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>BUs</TableHead>
                  <TableHead>PBMs</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quarter</TableHead>
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
                    <TableCell className="font-mono text-sm">
                      {activity.activity_id}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate">{activity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.market}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(activity.bu_array && activity.bu_array.length > 0 
                          ? activity.bu_array 
                          : [activity.bu]
                        ).map((bu, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs whitespace-nowrap">
                            {bu}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {activity.pbm_names && activity.pbm_names.length > 0 ? (
                          activity.pbm_names.map((pbm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs whitespace-nowrap">
                              {pbm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.activity_type ? (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {activity.activity_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.assigned_team_member ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.assigned_team_member.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.assigned_team_member.team}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <StatusBadgeV3 status={activity.status_v3 || 'Not Start'} />
                        {activity.status_v3 === 'Planning' && !activity.hp_approval_email_url && (
                          <span title="HP Approval required to proceed">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <QuarterBadge quarter={activity.fiscal_quarter} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {getCurrencySymbol(activity.currency)}
                      {activity.approved_budget.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Badge variant="secondary" className="mb-4">No Results</Badge>
              <h2 className="text-lg font-semibold text-foreground">No activities found</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {searchQuery || typeFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first activity to get started."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Detail View */}
      {selectedActivity && (
        <ActivityDetailView
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdate={refetch}
        />
      )}
    </AppLayout>
  );
}