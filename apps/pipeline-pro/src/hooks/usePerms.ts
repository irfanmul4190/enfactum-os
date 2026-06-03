import { useAuth } from '@/contexts/AuthContext';

/**
 * Editing rights for the core working data — client managers, clients,
 * projects, decks (documents) and pipeline deals.
 *
 * Any signed-in @enfactum.com employee may add / edit / delete these,
 * regardless of their access-matrix level. (Sign-in is already restricted to
 * @enfactum.com by the auth gate, and RLS grants the same via
 * is_enfactum_user(); this hook just keeps the UI in step.)
 *
 * Admin-only surfaces (Admin Settings, Import) still gate on `canAdmin` from
 * useAuth and are intentionally NOT covered here.
 */
export function usePerms() {
  const { canWrite, canAdmin, canRead, user } = useAuth();
  const isEnfactum =
    canRead && !!user?.email?.toLowerCase().endsWith('@enfactum.com');
  return {
    canEdit: canWrite || isEnfactum,
    canDelete: canAdmin || isEnfactum,
  };
}
