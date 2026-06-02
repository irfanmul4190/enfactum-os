-- =============================================================================
-- 2026-05-22  Financing Hub: add revenue_type to invoices.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Invoice Entry collects a Revenue Type (Consulting / Marketing Services /
-- Impact / Manpower / Pass-Thru / Other) but it was being discarded on save —
-- the invoices table had no column for it. This adds the column so the value
-- persists and the Analytics "Revenue Type Mix" chart has a data source.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS revenue_type text;

COMMIT;
