import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";
import { PERMISSION_GUARDRAILS, PermissionKey } from "./useRolePermissions";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface CurrentUserPermissions {
  role: AppRole | null;
  can_edit_budget: boolean;
  can_view_margin: boolean;
  can_approve_poe: boolean;
  can_mark_paid: boolean;
  can_delete_activity: boolean;
  can_view_all_regions: boolean;
  teamMemberId: string | null;
  accessibleRegions: string[];
  isLoading: boolean;
}

// Hardcoded safety rules - Partners and Client-side roles can NEVER see margin
const MARGIN_BLOCKED_ROLES: AppRole[] = ['Partner', 'PBM', 'PMM'];

// Budget editing is blocked for these roles regardless of DB setting
const BUDGET_EDIT_BLOCKED_ROLES: AppRole[] = ['Partner'];

// Valid app roles for type safety
const VALID_APP_ROLES: AppRole[] = ['Agency Director', 'Ops', 'Project Lead', 'PMM', 'PBM', 'Partner', 'Super Admin'];

function isValidAppRole(role: string): role is AppRole {
  return VALID_APP_ROLES.includes(role as AppRole);
}

export function useCurrentUserPermissions(): CurrentUserPermissions {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['current-user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.email) {
        return null;
      }

      // First, get the team_member record for this user
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id, role, accessible_regions')
        .eq('email', user.email)
        .maybeSingle();

      if (!teamMember) {
        // Check user_roles table as fallback
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role, market_access')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!userRole) {
          return null;
        }

        // Get permissions for this role
        const { data: permissions } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', userRole.role as Database["public"]["Enums"]["app_role"])
          .maybeSingle();

        return {
          role: userRole.role as AppRole,
          permissions,
          teamMemberId: null,
          accessibleRegions: userRole.market_access || [],
        };
      }

      // Validate the role from team_members
      const teamMemberRole = teamMember.role;
      const validatedRole: AppRole | null = isValidAppRole(teamMemberRole) ? teamMemberRole : null;

      if (!validatedRole) {
        return {
          role: null,
          permissions: null,
          teamMemberId: teamMember.id,
          accessibleRegions: teamMember.accessible_regions || [],
        };
      }

      // Get permissions for this role - cast to the enum type for Supabase query
      const { data: permissions } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', validatedRole as Database["public"]["Enums"]["app_role"])
        .maybeSingle();

      return {
        role: validatedRole,
        permissions,
        teamMemberId: teamMember.id,
        accessibleRegions: teamMember.accessible_regions || [],
      };
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Apply hardcoded guardrails on top of database permissions
  const role = data?.role || null;
  const dbPermissions = data?.permissions;

  // Calculate effective permissions with guardrails
  const getEffectivePermission = (key: PermissionKey, dbValue: boolean | null | undefined): boolean => {
    // If role has this permission locked by guardrails, always return false
    if (role && PERMISSION_GUARDRAILS[role]?.includes(key)) {
      return false;
    }
    return dbValue ?? false;
  };

  // Special handling for margin visibility - hardcoded safety
  const canViewMargin = role && MARGIN_BLOCKED_ROLES.includes(role) 
    ? false 
    : getEffectivePermission('can_view_margin', dbPermissions?.can_view_margin);

  // Special handling for budget editing - hardcoded safety
  const canEditBudget = role && BUDGET_EDIT_BLOCKED_ROLES.includes(role)
    ? false
    : getEffectivePermission('can_edit_budget', dbPermissions?.can_edit_budget);

  return {
    role,
    can_edit_budget: canEditBudget,
    can_view_margin: canViewMargin,
    can_approve_poe: getEffectivePermission('can_approve_poe', dbPermissions?.can_approve_poe),
    can_mark_paid: getEffectivePermission('can_mark_paid', dbPermissions?.can_mark_paid),
    can_delete_activity: getEffectivePermission('can_delete_activity', dbPermissions?.can_delete_activity),
    can_view_all_regions: getEffectivePermission('can_view_all_regions', dbPermissions?.can_view_all_regions),
    teamMemberId: data?.teamMemberId || null,
    accessibleRegions: data?.accessibleRegions || [],
    isLoading,
  };
}

// Helper to check if user is internal (not a Partner)
export function useIsInternalUser(): boolean {
  const { role } = useCurrentUserPermissions();
  return role !== null && role !== 'Partner';
}
