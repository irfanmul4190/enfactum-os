-- =============================================================================
-- 2026-05-22  Let matrix admins write the accounts table.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- The launcher's /admin/accounts page is gated to matrix admins and exists
-- specifically to manage accounts + leads. Lead writes already allow
-- is_matrix_admin() (see 20260519160000), but the accounts write policies
-- only allowed pipeline-pro / profit-navigator app-write — so a matrix admin
-- without one of those grants got RLS-rejected when adding or editing an
-- account. This aligns the accounts write policies with the page's gate.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "Shared insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Shared update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Shared delete accounts" ON public.accounts;

CREATE POLICY "Shared insert accounts" ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
    OR public.is_matrix_admin()
  );

CREATE POLICY "Shared update accounts" ON public.accounts
  FOR UPDATE TO authenticated
  USING (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
    OR public.is_matrix_admin()
  )
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
    OR public.is_matrix_admin()
  );

CREATE POLICY "Shared delete accounts" ON public.accounts
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('profit-navigator')
    OR public.is_matrix_admin()
  );

COMMIT;
