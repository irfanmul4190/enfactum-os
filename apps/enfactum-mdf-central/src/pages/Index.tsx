import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuarterFilter } from "@/components/activities/QuarterFilter";
import { KanbanBoard } from "@/components/activities/KanbanBoard";
import { CreateActivityModal } from "@/components/activities/CreateActivityModal";
import { ActivityDetailView } from "@/components/activities/ActivityDetailView";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BudgetMetricsCard } from "@/components/dashboard/BudgetMetricsCard";
import { CreativeApprovalQueue } from "@/components/dashboard/CreativeApprovalQueue";
import { DeadlineTracker } from "@/components/dashboard/DeadlineTracker";
import { useActivities, useActivityStats } from "@/hooks/useActivities";
import { Activity } from "@/types/database";
import { getCurrentHPQuarter } from "@/lib/constants";
import { 
  FolderKanban, 
  TrendingUp, 
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  const currentQuarter = getCurrentHPQuarter();
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter.quarter);
  const [fiscalYear, setFiscalYear] = useState(currentQuarter.year);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { data: activities = [], isLoading, refetch } = useActivities(
    selectedQuarter === 'all' ? undefined : selectedQuarter
  );
  const stats = useActivityStats(activities);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Enfactum Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              MDF Program Management - Asia Pacific Operations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <QuarterFilter
              value={selectedQuarter}
              onValueChange={setSelectedQuarter}
              fiscalYear={fiscalYear}
              onFiscalYearChange={setFiscalYear}
            />
            <CreateActivityModal onSuccess={() => refetch()} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total Activities"
                value={stats.totalCount}
                subtitle={`${selectedQuarter === 'all' ? 'All quarters' : selectedQuarter} FY${fiscalYear}`}
                icon={<FolderKanban className="h-5 w-5" />}
              />
              <StatsCard
                title="Active"
                value={stats.activeCount}
                subtitle="In progress"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatsCard
                title="Completed"
                value={stats.completedCount}
                subtitle="Synced activities"
                icon={<CheckCircle className="h-5 w-5" />}
              />
              <StatsCard
                title="At Risk"
                value={stats.atRiskCount}
                subtitle="≤30 days to deadline"
                icon={<AlertTriangle className="h-5 w-5" />}
                className={stats.atRiskCount > 0 ? "border-amber-300/50" : ""}
              />
              <StatsCard
                title="Urgent"
                value={stats.urgentCount + stats.overdueCount}
                subtitle="≤14 days or overdue"
                icon={<AlertCircle className="h-5 w-5" />}
                className={(stats.urgentCount + stats.overdueCount) > 0 ? "border-destructive/50" : ""}
              />
            </>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Kanban Board */}
          <div className="xl:col-span-3">
            <div className="section-container p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Activity Pipeline
                </h2>
                <span className="text-sm text-muted-foreground">
                  Click card to view details
                </span>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <KanbanBoard 
                  activities={activities}
                  onActivityClick={(activity) => setSelectedActivity(activity)}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <BudgetMetricsCard 
              totalAllocated={stats.totalBudget}
              totalClaimed={stats.totalClaimed}
            />
            <CreativeApprovalQueue 
              onViewAll={() => navigate('/creatives')}
            />
            <DeadlineTracker 
              activities={activities}
              onActivityClick={(activity) => setSelectedActivity(activity)}
            />
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActivityDetailView
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdate={() => refetch()}
        />
      )}
    </AppLayout>
  );
}
