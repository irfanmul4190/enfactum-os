-- =============================================================================
-- 2026-05-22  Profit Navigator: project_details companion table + account cols.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Profit Navigator's Project and Client objects are much richer than the
-- shared public.deals / public.accounts tables. With the shared-tables model,
-- the core fields map straight onto a deal/account, but the commercial config
-- (margin target, commercial model, invoice model, pass-through settings,
-- delivery dates, etc.) has nowhere to live and would be silently dropped on
-- every save.
--
-- This migration keeps the shared model intact and adds:
--   1. public.project_details — a 1:1 companion to public.deals (deal_id PK),
--      exactly the pattern public.margins already uses. Holds the Profit
--      Navigator-specific project fields. Pipeline Pro ignores this table.
--   2. Three nullable columns on public.accounts (legal_name, tax_treatment,
--      notes) so the client form round-trips losslessly. payment_terms maps to
--      the existing default_payment_terms_days; billing contact maps to the
--      existing primary_contact_name / primary_contact_email.
--
-- RLS on project_details mirrors deals after 20260522120000: pipeline-pro OR
-- profit-navigator.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. accounts: client-detail columns ------------------------------------
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS legal_name    text,
  ADD COLUMN IF NOT EXISTS tax_treatment text,
  ADD COLUMN IF NOT EXISTS notes         text;

-- ---- 2. project_details companion table ------------------------------------
CREATE TABLE IF NOT EXISTS public.project_details (
  deal_id                          uuid PRIMARY KEY
                                     REFERENCES public.deals(id) ON DELETE CASCADE,
  country_of_delivery              text,
  start_date                       date,
  end_date                         date,
  business_type                    text,
  commercial_model                 text,
  invoice_model                    text,
  revenue_recognition_basis        text,
  margin_target_percent            numeric,
  approvals_status                 text,
  sales_person                     text,
  external_partner_stakeholder_id  text,
  partner_revenue_basis_ex_tax     numeric,
  flat_fee_percent                 numeric,
  pass_through_payout_basis        text,
  internal_recharge_applies        boolean,
  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_project_details_updated ON public.project_details;
CREATE TRIGGER trg_project_details_updated BEFORE UPDATE ON public.project_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- 3. RLS on project_details (mirrors deals) -----------------------------
ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared read project_details"   ON public.project_details;
DROP POLICY IF EXISTS "Shared insert project_details" ON public.project_details;
DROP POLICY IF EXISTS "Shared update project_details" ON public.project_details;
DROP POLICY IF EXISTS "Shared delete project_details" ON public.project_details;

CREATE POLICY "Shared read project_details" ON public.project_details
  FOR SELECT TO authenticated
  USING (
       public.can_read_app('pipeline-pro')
    OR public.can_read_app('profit-navigator')
  );

CREATE POLICY "Shared insert project_details" ON public.project_details
  FOR INSERT TO authenticated
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared update project_details" ON public.project_details
  FOR UPDATE TO authenticated
  USING (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  )
  WITH CHECK (
       public.can_write_app('pipeline-pro')
    OR public.can_write_app('profit-navigator')
  );

CREATE POLICY "Shared delete project_details" ON public.project_details
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('pipeline-pro')
    OR public.can_admin_app('profit-navigator')
  );

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='accounts'
--      AND column_name IN ('legal_name','tax_treatment','notes');
--   -- expect 3 rows.
--
--   SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname='public' AND tablename='project_details'
--    ORDER BY cmd, policyname;
--   -- expect 4 "Shared ..." policies.
-- =============================================================================
