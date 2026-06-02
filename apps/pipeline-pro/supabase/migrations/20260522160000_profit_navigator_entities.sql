-- =============================================================================
-- 2026-05-22  Profit Navigator: operational entity tables.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Profit Navigator kept timesheets, vendor costs, other costs, invoices,
-- stakeholder splits, stakeholders and vendors in React state only — every
-- entry was lost on refresh. This creates persistent tables for them.
--
-- Design notes:
--   - id is `text` and supplied by the client (a UUID generated in the app).
--     This lets Profit Navigator insert optimistically without a round-trip
--     and keeps cross-entity references (e.g. a split's stakeholder_id) stable.
--   - Date-like fields are `text` — the app stores them as plain strings and
--     never range-queries them in SQL; text avoids insert failures on loose
--     or empty values.
--   - No cross-table foreign keys: the app manages referential integrity and
--     these are operational scratch tables. RLS still gates all access.
--   - RLS: profit-navigator read for read access; write for insert/update/
--     delete (operational data — plain write users manage their own rows).
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pn_stakeholders (
  id                      text PRIMARY KEY,
  stakeholder_name        text NOT NULL,
  stakeholder_type        text,
  default_payout_model    text,
  default_payout_value    numeric,
  default_payment_trigger text,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_vendors (
  id                     text PRIMARY KEY,
  vendor_name            text NOT NULL,
  category_default       text,
  currency_default       text,
  payment_terms_default  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_timesheets (
  id              text PRIMARY KEY,
  project_id      text,
  resource_id     text,
  work_date       text,
  hours           numeric,
  activity_type   text,
  cost_rate       numeric,
  cost_amount     numeric,
  recharge_rate   numeric,
  recharge_amount numeric,
  notes           text,
  status          text,
  approved_by     text,
  approved_at     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_vendor_costs (
  id             text PRIMARY KEY,
  project_id     text,
  vendor_id      text,
  cost_category  text,
  cost_type      text,
  planned_amount numeric,
  actual_amount  numeric,
  invoice_ref    text,
  invoice_date   text,
  payment_status text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_other_costs (
  id             text PRIMARY KEY,
  project_id     text,
  category       text,
  planned_amount numeric,
  actual_amount  numeric,
  receipt_ref    text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_invoices (
  id            text PRIMARY KEY,
  project_id    text,
  invoice_no    text,
  invoice_date  text,
  amount_ex_tax numeric,
  tax_amount    numeric,
  total_amount  numeric,
  status        text,
  paid_date     text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pn_project_splits (
  id              text PRIMARY KEY,
  project_id      text,
  stakeholder_id  text,
  role_on_project text,
  payout_model    text,
  payout_value    numeric,
  cap_type        text,
  cap_value       numeric,
  floor_type      text,
  floor_value     numeric,
  payment_trigger text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- triggers + RLS for all seven tables -----------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pn_stakeholders','pn_vendors','pn_timesheets','pn_vendor_costs',
    'pn_other_costs','pn_invoices','pn_project_splits'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "PN read %1$s"   ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "PN insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "PN update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "PN delete %1$s" ON public.%1$I', t);

    EXECUTE format($q$
      CREATE POLICY "PN read %1$s" ON public.%1$I
        FOR SELECT TO authenticated USING (public.can_read_app('profit-navigator'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "PN insert %1$s" ON public.%1$I
        FOR INSERT TO authenticated WITH CHECK (public.can_write_app('profit-navigator'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "PN update %1$s" ON public.%1$I
        FOR UPDATE TO authenticated
        USING (public.can_write_app('profit-navigator'))
        WITH CHECK (public.can_write_app('profit-navigator'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "PN delete %1$s" ON public.%1$I
        FOR DELETE TO authenticated USING (public.can_write_app('profit-navigator'))
    $q$, t);
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT tablename FROM pg_tables
--    WHERE schemaname='public' AND tablename LIKE 'pn\_%'
--    ORDER BY tablename;
--   -- expect 7 rows.
-- =============================================================================
