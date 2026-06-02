-- =============================================================================
-- 2026-05-22  Profit Navigator write access to shared accounts/deals/margins.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Profit Navigator treats a "client" as a row in public.accounts and a
-- "project" as a row in public.deals (its profitability data lives in
-- public.margins). Until now the RLS policies on those tables granted
-- read/write only to pipeline-pro (with accounts also readable by
-- financing-hub). That left Profit Navigator's create / edit / delete paths
-- silently blocked by RLS — and even reads of accounts/margins returned an
-- empty set for a profit-navigator-only user.
--
-- This migration widens the policies so a profit-navigator matrix grant works
-- too. The tables stay a single shared source of truth: an edit made in
-- Profit Navigator is visible in Pipeline Pro and vice versa.
--
--   read   : can_read_app(...)   for either app
--   write  : can_write_app(...)  for either app   (INSERT / UPDATE)
--   delete : can_admin_app(...)  for either app   (kept admin-only, matching
--            the existing pipeline-pro convention — loosen here if a plain
--            'write' user should be allowed to delete)
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- deals ----------------------------------------------------------------
DROP POLICY IF EXISTS "Pipeline read deals"   ON public.deals;
DROP POLICY IF EXISTS "Pipeline insert deals" ON public.deals;
DROP POLICY IF EXISTS "Pipeline update deals" ON public.deals;
DROP POLICY IF EXISTS "Pipeline delete deals" ON public.deals;
DROP POLICY IF EXISTS "Shared read deals"     ON public.deals;
DROP POLICY IF EXISTS "Shared insert deals"   ON public.deals;
DROP POLICY IF EXISTS "Shared update deals"   ON public.deals;
DROP POLICY IF EXISTS "Shared delete deals"   ON public.deals;

CREATE POLICY "Shared read deals" ON public.deals
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('profit-navigator')
  );

CREATE POLICY "Shared insert deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared update deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  )
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared delete deals" ON public.deals
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('profit-navigator')
  );

-- ---- margins --------------------------------------------------------------
DROP POLICY IF EXISTS "Pipeline read margins"   ON public.margins;
DROP POLICY IF EXISTS "Pipeline insert margins" ON public.margins;
DROP POLICY IF EXISTS "Pipeline update margins" ON public.margins;
DROP POLICY IF EXISTS "Pipeline delete margins" ON public.margins;
DROP POLICY IF EXISTS "Shared read margins"     ON public.margins;
DROP POLICY IF EXISTS "Shared insert margins"   ON public.margins;
DROP POLICY IF EXISTS "Shared update margins"   ON public.margins;
DROP POLICY IF EXISTS "Shared delete margins"   ON public.margins;

CREATE POLICY "Shared read margins" ON public.margins
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('profit-navigator')
  );

CREATE POLICY "Shared insert margins" ON public.margins
  FOR INSERT TO authenticated
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared update margins" ON public.margins
  FOR UPDATE TO authenticated
  USING (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  )
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared delete margins" ON public.margins
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('profit-navigator')
  );

-- ---- accounts -------------------------------------------------------------
-- SELECT was "Shared read accounts" (pipeline-pro OR financing-hub); recreate
-- it with profit-navigator added. Writes were pipeline-pro only — widen to
-- profit-navigator. Financing-hub stays read-only on accounts by design.
DROP POLICY IF EXISTS "Shared read accounts"     ON public.accounts;
DROP POLICY IF EXISTS "Pipeline insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Pipeline update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Pipeline delete accounts" ON public.accounts;
DROP POLICY IF EXISTS "Shared insert accounts"   ON public.accounts;
DROP POLICY IF EXISTS "Shared update accounts"   ON public.accounts;
DROP POLICY IF EXISTS "Shared delete accounts"   ON public.accounts;

CREATE POLICY "Shared read accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('enfactum-financing-hub')
    OR public.can_read_app('profit-navigator')
  );

CREATE POLICY "Shared insert accounts" ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared update accounts" ON public.accounts
  FOR UPDATE TO authenticated
  USING (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  )
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared delete accounts" ON public.accounts
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('profit-navigator')
  );

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT tablename, policyname, cmd
--     FROM pg_policies
--    WHERE schemaname = 'public'
--      AND tablename IN ('accounts','deals','margins')
--    ORDER BY tablename, cmd, policyname;
--   -- Expect, per table: one "Shared read", "Shared insert", "Shared update",
--   -- "Shared delete" policy and no remaining "Pipeline ..." policies.
-- =============================================================================
