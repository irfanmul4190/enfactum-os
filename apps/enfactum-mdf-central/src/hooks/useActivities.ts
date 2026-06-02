import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ActivityStatus, BusinessUnit, FundingSource, Financial, ActivityType, TeamMember, getDeadlineRisk } from "@/types/database";
import { toast } from "sonner";

export function useActivities(fiscalQuarter?: string) {
  return useQuery({
    queryKey: ['activities', fiscalQuarter],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select(`
          *,
          partner:partners(*),
          financials(*),
          assigned_team_member:team_members!activities_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (fiscalQuarter && fiscalQuarter !== 'all') {
        query = query.ilike('fiscal_quarter', `%${fiscalQuarter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        ...row,
        bu: row.bu as BusinessUnit,
        status: row.status as ActivityStatus,
        funding_source: row.funding_source as FundingSource,
        activity_type: row.activity_type as ActivityType | undefined,
        financials: row.financials?.[0] as Financial | undefined,
        assigned_team_member: row.assigned_team_member as TeamMember | undefined,
      })) as Activity[];
    },
  });
}

export function useActivityStats(activities: Activity[] = []) {
  const totalBudget = activities.reduce((sum, a) => sum + (a.approved_budget || a.financials?.approved_budget || 0), 0);
  const totalClaimed = activities.reduce((sum, a) => sum + (a.financials?.actual_cost || 0), 0);

  // Use status_v3 (the actual progression the UI writes) rather than the
  // legacy status field which is always 'Not Started' on insert.
  const activeCount = activities.filter(a =>
    ['Executing', 'Activity Completed', 'Claiming', 'POE Submitted', 'Payment Documentation', 'Payment Submitted'].includes(a.status_v3 || '')
  ).length;

  const completedCount = activities.filter(a =>
    (a.status_v3 || '') === 'Paid'
  ).length;
  
  // Count by deadline risk
  const atRiskCount = activities.filter(a => {
    const deadline = a.claim_deadline || a.financials?.claim_deadline;
    const risk = getDeadlineRisk(deadline);
    return risk === 'at-risk';
  }).length;

  const urgentCount = activities.filter(a => {
    const deadline = a.claim_deadline || a.financials?.claim_deadline;
    const risk = getDeadlineRisk(deadline);
    return risk === 'urgent';
  }).length;

  const overdueCount = activities.filter(a => {
    const deadline = a.claim_deadline || a.financials?.claim_deadline;
    const risk = getDeadlineRisk(deadline);
    return risk === 'overdue';
  }).length;

  return {
    totalBudget,
    totalClaimed,
    totalCount: activities.length,
    activeCount,
    completedCount,
    atRiskCount,
    urgentCount,
    overdueCount,
    utilizationRate: totalBudget > 0 ? (totalClaimed / totalBudget) * 100 : 0,
  };
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Activity> }) => {
      // Logic Gate: Prevent status change to "Executing" without HP approval
      if (updates.status === 'Executing') {
        const { data: activity } = await supabase
          .from('activities')
          .select('hp_approval_email_url')
          .eq('id', id)
          .single();

        if (!activity?.hp_approval_email_url) {
          throw new Error('Cannot change status to Executing without HP approval email URL');
        }
      }

      const { error } = await supabase
        .from('activities')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success("Activity updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update activity");
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success("Activity deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete activity");
    },
  });
}

export function useFinancials() {
  return useQuery({
    queryKey: ['financials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financials')
        .select(`
          *,
          activity:activities(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreativeApprovals() {
  return useQuery({
    queryKey: ['creative-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_approvals')
        .select(`
          *,
          activity:activities(name, activity_id)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
