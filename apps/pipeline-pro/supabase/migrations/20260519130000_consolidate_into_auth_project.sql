-- =============================================================================
-- 2026-05-19  Consolidate pipeline-pro tables into the auth Supabase project.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the auth project — the one with the
-- employees table and Google SSO already configured).
-- DO NOT RUN ON the old data project (hnhwlcgqpmqaddhzykce). That project is
-- being decommissioned.
--
-- What this does:
--   1. Creates the pipeline-pro tables (accounts, deals, margins, events) and
--      the v_deals view on the auth project. Schema mirrors the original
--      from 20260514150830_*.sql.
--   2. Adds the columns pipeline-pro expects on the EXISTING employees table
--      (department, status, skills, created_at, updated_at) if they are
--      missing. The employees table is left intact — auth flows continue to
--      work without interruption.
--   3. Enables RLS with the tightened "authenticated-only writes" policies
--      (no more "Anon write *" holes).
--
-- After this runs:
--   - Pipeline-pro will use this project as both its auth and data backend.
--   - The old data project (hnhwlcgqpmqaddhzykce) can be deleted from the
--     Supabase dashboard.
-- =============================================================================

BEGIN;

-- ---- helpers ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ---- accounts -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  industry text,
  tier text,
  vendor_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  website text,
  primary_contact_name text,
  primary_contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_accounts_updated ON public.accounts;
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- employees (extend existing) ------------------------------------------
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS trg_employees_updated ON public.employees;
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- deals ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  stage text,
  value numeric,
  currency text DEFAULT 'SGD',
  win_probability numeric,
  expected_close_date date,
  actual_close_date date,
  loss_reason text,
  mdf_eligible boolean DEFAULT false,
  mdf_amount numeric,
  product_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_account ON public.deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON public.deals(owner_id);
DROP TRIGGER IF EXISTS trg_deals_updated ON public.deals;
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- margins --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.margins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  revenue numeric,
  cost_of_goods numeric,
  cost_of_services numeric,
  mdf_subsidy numeric,
  gross_profit numeric,
  gp_percent numeric,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_margins_updated ON public.margins;
CREATE TRIGGER trg_margins_updated BEFORE UPDATE ON public.margins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- events ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text,
  entity_type text,
  entity_id uuid,
  event_type text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_module_occurred ON public.events(module, occurred_at DESC);

-- ---- v_deals view ---------------------------------------------------------
-- An older v_deals view may exist on this project with different column
-- ordering. CREATE OR REPLACE can't reorder columns, so drop-and-recreate.
DROP VIEW IF EXISTS public.v_deals;
CREATE VIEW public.v_deals AS
SELECT
  d.id,
  d.title,
  d.description,
  d.stage,
  d.value,
  d.currency,
  d.win_probability,
  d.expected_close_date,
  d.actual_close_date,
  d.mdf_eligible,
  d.mdf_amount,
  d.product_lines,
  d.account_id,
  a.name AS account_name,
  a.industry,
  a.tier,
  a.vendor_flags AS account_vendor_flags,
  d.owner_id,
  e.name AS owner_name,
  e.email AS owner_email,
  m.revenue AS margin_revenue,
  m.gross_profit AS margin_gp,
  m.gp_percent AS margin_gp_percent,
  m.approved AS margin_approved,
  m.revenue,
  m.cost_of_goods,
  m.cost_of_services,
  m.mdf_subsidy,
  m.gross_profit,
  m.gp_percent,
  d.created_at AS deal_created_at,
  d.updated_at AS deal_updated_at
FROM public.deals d
LEFT JOIN public.accounts a ON a.id = d.account_id
LEFT JOIN public.employees e ON e.id = d.owner_id
LEFT JOIN public.margins m ON m.deal_id = d.id;

-- ---- RLS (tightened from the start) ---------------------------------------
ALTER TABLE public.accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events    ENABLE ROW LEVEL SECURITY;
-- employees already had RLS enabled in the original auth project; left alone.

-- Drop any legacy permissive policies if they were copied from the old project
DROP POLICY IF EXISTS "Anon write accounts"  ON public.accounts;
DROP POLICY IF EXISTS "Auth write accounts"  ON public.accounts;
DROP POLICY IF EXISTS "Public read accounts" ON public.accounts;
DROP POLICY IF EXISTS "Anon write deals"  ON public.deals;
DROP POLICY IF EXISTS "Auth write deals"  ON public.deals;
DROP POLICY IF EXISTS "Public read deals" ON public.deals;
DROP POLICY IF EXISTS "Anon write margins"  ON public.margins;
DROP POLICY IF EXISTS "Auth write margins"  ON public.margins;
DROP POLICY IF EXISTS "Public read margins" ON public.margins;
DROP POLICY IF EXISTS "Anon write events"  ON public.events;
DROP POLICY IF EXISTS "Auth write events"  ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;

-- Also drop the tightened policy names so the rest of this script is safe to
-- re-run after a partial failure (CREATE POLICY has no IF NOT EXISTS).
DROP POLICY IF EXISTS "Authenticated read accounts"   ON public.accounts;
DROP POLICY IF EXISTS "Authenticated insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated delete accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated read deals"   ON public.deals;
DROP POLICY IF EXISTS "Authenticated insert deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated update deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated delete deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated read margins"   ON public.margins;
DROP POLICY IF EXISTS "Authenticated insert margins" ON public.margins;
DROP POLICY IF EXISTS "Authenticated update margins" ON public.margins;
DROP POLICY IF EXISTS "Authenticated delete margins" ON public.margins;
DROP POLICY IF EXISTS "Authenticated read events"   ON public.events;
DROP POLICY IF EXISTS "Authenticated insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated delete events" ON public.events;

-- accounts: authenticated CRUD; no anon.
CREATE POLICY "Authenticated read accounts"   ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete accounts" ON public.accounts FOR DELETE TO authenticated USING (true);

-- deals
CREATE POLICY "Authenticated read deals"   ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update deals" ON public.deals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete deals" ON public.deals FOR DELETE TO authenticated USING (true);

-- margins
CREATE POLICY "Authenticated read margins"   ON public.margins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert margins" ON public.margins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update margins" ON public.margins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete margins" ON public.margins FOR DELETE TO authenticated USING (true);

-- events
CREATE POLICY "Authenticated read events"   ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update events" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete events" ON public.events FOR DELETE TO authenticated USING (true);

COMMIT;

-- Sanity check (run after the COMMIT):
--   SELECT tablename, policyname, roles, cmd FROM pg_policies
--   WHERE schemaname='public'
--     AND tablename IN ('accounts','deals','margins','events')
--   ORDER BY tablename, policyname;
-- Every row's `roles` column should be {authenticated}. Anything with {anon}
-- or {public} should not exist.
