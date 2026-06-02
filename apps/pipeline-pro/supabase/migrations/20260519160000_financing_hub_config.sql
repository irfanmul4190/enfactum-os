-- =============================================================================
-- 2026-05-19  Financing Hub config tables: extend accounts, add account_leads.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- - Adds columns to existing public.accounts that financing-hub needs (default
--   payment terms, billing currency). The accounts table is shared with
--   pipeline-pro; columns are nullable / defaulted so pipeline-pro keeps
--   working unchanged.
-- - Creates public.account_leads (the list of internal lead names invoices
--   are tagged with). New table; not used by pipeline-pro.
-- - Expands the SELECT policy on accounts so financing-hub readers can list
--   them. Writes still gated to pipeline-pro write/admin (accounts are
--   "owned" by pipeline-pro from a CRUD perspective).
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. extend accounts ---------------------------------------------------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS default_payment_terms_days int    DEFAULT 30,
  ADD COLUMN IF NOT EXISTS billing_currency           text   DEFAULT 'SGD',
  ADD COLUMN IF NOT EXISTS active                     boolean NOT NULL DEFAULT true;

-- ---- 2. account_leads -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  email       text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_account_leads_updated ON public.account_leads;
CREATE TRIGGER trg_account_leads_updated BEFORE UPDATE ON public.account_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.account_leads ENABLE ROW LEVEL SECURITY;

-- ---- 3. RLS on accounts: allow financing-hub readers ----------------------
-- Original SELECT policy was scoped to pipeline-pro only. Replace with a
-- combined policy that lets either app read.
DROP POLICY IF EXISTS "Pipeline read accounts"   ON public.accounts;
DROP POLICY IF EXISTS "Shared read accounts"     ON public.accounts;

CREATE POLICY "Shared read accounts" ON public.accounts
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('enfactum-financing-hub')
  );

-- INSERT/UPDATE/DELETE policies stay as-is (pipeline-pro write/admin). Adding
-- accounts is a pipeline-pro responsibility for now; financing-hub readers
-- can't mutate.

-- ---- 4. RLS on account_leads: shared read, admin-only write ---------------
DROP POLICY IF EXISTS "Shared read account_leads"  ON public.account_leads;
DROP POLICY IF EXISTS "Admin write account_leads"  ON public.account_leads;

CREATE POLICY "Shared read account_leads" ON public.account_leads
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('enfactum-financing-hub')
  );

-- Writes require matrix admin OR app-admin on either app. Account leads are
-- low-risk to add but should not be writable by every read user.
CREATE POLICY "Admin write account_leads" ON public.account_leads
  FOR ALL TO authenticated
  USING (
       public.is_matrix_admin()
    OR public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('enfactum-financing-hub')
  )
  WITH CHECK (
       public.is_matrix_admin()
    OR public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('enfactum-financing-hub')
  );

COMMIT;

-- =============================================================================
-- Sanity check:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='accounts'
--      AND column_name IN ('default_payment_terms_days','billing_currency','active');
--   -- expect 3 rows.
--
--   SELECT policyname, roles, cmd FROM pg_policies
--    WHERE schemaname='public' AND tablename IN ('accounts','account_leads')
--    ORDER BY tablename, policyname;
--   -- accounts: 'Shared read accounts' + the 3 'Pipeline insert/update/delete' from earlier.
--   -- account_leads: 'Admin write account_leads' (FOR ALL) + 'Shared read account_leads'.
--
-- To seed real accounts and leads after running this, use the Table Editor
-- or run something like:
--   INSERT INTO public.accounts (name, default_payment_terms_days, billing_currency)
--   VALUES ('HP', 30, 'SGD'), ('IT CAN', 30, 'SGD'), ('Oracle', 45, 'SGD')
--   ON CONFLICT (name) DO NOTHING;
--
--   INSERT INTO public.account_leads (name) VALUES
--     ('Pooja'), ('Sandeep'), ('William'), ('Sanjay C'), ('Irfan M'), ('Eve')
--   ON CONFLICT (name) DO NOTHING;
-- =============================================================================
