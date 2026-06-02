import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface RolePermission {
  id: string;
  role: AppRole;
  can_edit_budget: boolean;
  can_view_margin: boolean;
  can_approve_poe: boolean;
  can_mark_paid: boolean;
  can_delete_activity: boolean;
  can_view_all_regions: boolean;
  created_at: string;
  updated_at: string;
}

// Define display names and order for roles
export const ROLE_DISPLAY_CONFIG: Record<AppRole, { label: string; order: number }> = {
  'Agency Director': { label: 'Agency Director', order: 1 },
  'Ops': { label: 'Operations Lead', order: 2 },
  'Project Lead': { label: 'Project Executive', order: 3 },
  'PMM': { label: 'HP PMM', order: 4 },
  'PBM': { label: 'HP PBM', order: 5 },
  'Partner': { label: 'Partner', order: 6 },
  'Super Admin': { label: 'Super Admin', order: 7 },
};

// Permission column definitions
export const PERMISSION_COLUMNS = [
  { key: 'can_edit_budget', label: 'Edit Budget' },
  { key: 'can_view_margin', label: 'View Margin' },
  { key: 'can_approve_poe', label: 'Approve POE' },
  { key: 'can_mark_paid', label: 'Mark as Paid' },
  { key: 'can_delete_activity', label: 'Delete Activity' },
  { key: 'can_view_all_regions', label: 'View All Regions' },
] as const;

export type PermissionKey = typeof PERMISSION_COLUMNS[number]['key'];

// Hardcoded guardrails - these permissions can NEVER be enabled for certain roles
export const PERMISSION_GUARDRAILS: Partial<Record<AppRole, PermissionKey[]>> = {
  'Partner': ['can_view_margin', 'can_delete_activity', 'can_edit_budget'],
  'PBM': ['can_view_margin'],
  'PMM': ['can_view_margin'],
};

// Only these roles can have 'Mark as Paid' enabled
export const MARK_PAID_ALLOWED_ROLES: AppRole[] = ['Ops', 'Agency Director', 'Super Admin'];

export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role');

      if (error) throw error;
      return (data as unknown as RolePermission[]).sort((a, b) => {
        const orderA = ROLE_DISPLAY_CONFIG[a.role]?.order ?? 99;
        const orderB = ROLE_DISPLAY_CONFIG[b.role]?.order ?? 99;
        return orderA - orderB;
      });
    },
  });
}

export function useUpdateRolePermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      role, 
      permission, 
      value 
    }: { 
      role: AppRole; 
      permission: PermissionKey; 
      value: boolean;
    }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update({ [permission]: value })
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permission Updated",
        description: "The permission has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update permission. " + error.message,
        variant: "destructive",
      });
    },
  });
}

export function isPermissionLocked(role: AppRole, permission: PermissionKey): boolean {
  // Check if this role has this permission permanently locked off
  const lockedPermissions = PERMISSION_GUARDRAILS[role];
  if (lockedPermissions?.includes(permission)) {
    return true;
  }

  // Check if this is 'mark_paid' and role is not allowed
  if (permission === 'can_mark_paid' && !MARK_PAID_ALLOWED_ROLES.includes(role)) {
    return true;
  }

  return false;
}
