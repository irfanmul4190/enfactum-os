import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FolderOpen,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Building2,
  FileText,
  Activity,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useProject,
  useProjectActivities,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface ProjectDetailSheetProps {
  projectId: string | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function ProjectDetailSheet({ projectId, onClose }: ProjectDetailSheetProps) {
  const { data: project, isLoading } = useProject(projectId || undefined);
  const { data: activities } = useProjectActivities(projectId || undefined);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const permissions = useCurrentUserPermissions();
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (project?.status) {
      setStatus(project.status);
    }
  }, [project?.status]);

  const handleStatusChange = async (newStatus: string) => {
    if (!projectId) return;
    setStatus(newStatus);
    await updateProject.mutateAsync({
      id: projectId,
      status: newStatus as "Draft" | "Active" | "Completed" | "On Hold",
    });
  };

  const handleDelete = async () => {
    if (!projectId) return;
    await deleteProject.mutateAsync(projectId);
    onClose();
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!projectId) return null;

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <SheetTitle>{project?.name || "Loading..."}</SheetTitle>
          </div>
          <SheetDescription>
            Project details and associated activities
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : project ? (
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Client</span>
                  </div>
                  <p className="text-sm font-medium">
                    {project.clients?.name || "No client"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Market</span>
                  </div>
                  <p className="text-sm font-medium">{project.market}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Project Lead</span>
                  </div>
                  <p className="text-sm font-medium">
                    {project.team_members?.full_name || "Unassigned"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Total Budget</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(project.total_budget, project.currency)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Start Date</span>
                  </div>
                  <p className="text-sm font-medium">
                    {project.start_date
                      ? format(new Date(project.start_date), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>End Date</span>
                  </div>
                  <p className="text-sm font-medium">
                    {project.end_date
                      ? format(new Date(project.end_date), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Description</span>
                    </div>
                    <p className="text-sm">{project.description}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Activities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Activities ({activities?.length || 0})</span>
                  </div>
                </div>

                {activities && activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.activity_id}
                          </p>
                        </div>
                        <StatusBadge status={activity.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activities assigned to this project yet.
                  </p>
                )}
              </div>

              {/* Delete Button */}
              {permissions.can_delete_activity && (
                <>
                  <Separator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the project. Activities
                          under this project will not be deleted but will be
                          unlinked.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Project not found.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
