-- =============================================================================
-- 2026-05-22  Financing Hub: real invoices table (system of record).
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Until now Financing Hub had no invoice storage. It read the v_contracts
-- view and adapted contract rows into Invoice objects (contractToInvoice),
-- and Invoice Entry / "Push to Tracker" only mutated React state — every
-- entry was lost on refresh. Contracts and invoices are different domain
-- objects, so this creates a dedicated public.invoices table whose columns
-- mirror the app's Invoice type (src/data/invoiceData.ts).
--
-- The id is a bigint identity so it matches the existing `Invoice.id: number`
-- shape on the client; no UUID reconciliation needed there.
--
-- invoice_number is intentionally NOT unique — the app treats a repeated
-- number as a soft "duplicate" warning (credit notes, re-issues), not a hard
-- error.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- invoices table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number          text    NOT NULL,
  company                 text    NOT NULL,
  billed_to               text,
  date                    date    NOT NULL,
  account                 text,
  account_lead            text,
  country                 text,
  currency                text    NOT NULL DEFAULT 'SGD'
                            CHECK (currency IN ('SGD', 'USD')),
  has_gst                 boolean NOT NULL DEFAULT true,
  month                   text,                 -- e.g. "Jan-26" (derived from date)
  fiscal_year             text,                 -- e.g. "FY2025" (FY starts April)
  amount_sgd_ex_tax       numeric,
  amount_sgd_with_tax     numeric,
  amount_usd_ex_tax       numeric,
  amount_usd_with_tax     numeric,
  amount_sgd_converted    numeric,
  total_billing_sgd       numeric NOT NULL DEFAULT 0,
  payment_received_month  text,                 -- null = payment still pending
  remarks                 text,
  created_by_email        text,                 -- attribution; not a FK
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date   ON public.invoices(date);

DROP TRIGGER IF EXISTS trg_invoices_updated ON public.invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- RLS ------------------------------------------------------------------
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FH read invoices"   ON public.invoices;
DROP POLICY IF EXISTS "FH insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "FH update invoices" ON public.invoices;
DROP POLICY IF EXISTS "FH delete invoices" ON public.invoices;

CREATE POLICY "FH read invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.can_read_app('enfactum-financing-hub'));

CREATE POLICY "FH insert invoices" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_app('enfactum-financing-hub'));

CREATE POLICY "FH update invoices" ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.can_write_app('enfactum-financing-hub'))
  WITH CHECK (public.can_write_app('enfactum-financing-hub'));

-- Deleting a financial record is destructive — gate it on app-admin (or a
-- matrix admin). Loosen to can_write_app(...) if plain write users should be
-- allowed to delete invoices.
CREATE POLICY "FH delete invoices" ON public.invoices
  FOR DELETE TO authenticated
  USING (
       public.can_admin_app('enfactum-financing-hub')
    OR public.is_matrix_admin()
  );

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT column_name, data_type
--     FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'invoices'
--    ORDER BY ordinal_position;
--
--   SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'invoices'
--    ORDER BY cmd, policyname;
--   -- Expect 4 policies: FH read / insert / update / delete.
-- =============================================================================
