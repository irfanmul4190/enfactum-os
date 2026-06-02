-- =============================================================================
-- 2026-05-24  HR lookups (department / role / designation dropdowns).
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- A single table holds dropdown values for the three free-form fields on
-- public.employees that have been producing typo duplicates (Engineering /
-- engineering / ENG). The HR Hub combobox sources its options from here,
-- with a fallback to add a new value inline (which writes back into this
-- table). The HR Hub Settings page exposes a CRUD UI gated on
-- can_admin_app('hr-hub').
--
-- Note: this table stores the canonical option labels. employees.department
-- / employees.role / employees.designation still carry the raw text — so
-- renaming a lookup row does NOT update existing employee rows. Soft-delete
-- via `active=false` hides the option from new dropdowns without breaking
-- existing employees who still carry the value.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.hr_lookups (
  id         uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('department', 'role', 'designation')),
  value      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

CREATE INDEX IF NOT EXISTS idx_hr_lookups_kind_active
  ON public.hr_lookups(kind, active);

DROP TRIGGER IF EXISTS trg_hr_lookups_updated ON public.hr_lookups;
CREATE TRIGGER trg_hr_lookups_updated BEFORE UPDATE ON public.hr_lookups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Seed from any existing distinct values in employees -------------------
-- One-shot backfill so the combobox doesn't start empty. Existing freeform
-- text values become canonical options; new typos won't be auto-added (the
-- combobox does that on user action only).
INSERT INTO public.hr_lookups (kind, value)
SELECT 'department', dept FROM (
  SELECT DISTINCT trim(department) AS dept FROM public.employees
   WHERE department IS NOT NULL AND length(trim(department)) > 0
) s
ON CONFLICT (kind, value) DO NOTHING;

INSERT INTO public.hr_lookups (kind, value)
SELECT 'role', r FROM (
  SELECT DISTINCT trim(role) AS r FROM public.employees
   WHERE role IS NOT NULL AND length(trim(role)) > 0
) s
ON CONFLICT (kind, value) DO NOTHING;

INSERT INTO public.hr_lookups (kind, value)
SELECT 'designation', d FROM (
  SELECT DISTINCT trim(designation) AS d FROM public.employees
   WHERE designation IS NOT NULL AND length(trim(designation)) > 0
) s
ON CONFLICT (kind, value) DO NOTHING;

-- ---- RLS -------------------------------------------------------------------
ALTER TABLE public.hr_lookups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read hr_lookups"  ON public.hr_lookups;
DROP POLICY IF EXISTS "Write hr_lookups" ON public.hr_lookups;

-- Any authenticated user can read so the dropdowns work everywhere.
CREATE POLICY "Read hr_lookups" ON public.hr_lookups
  FOR SELECT TO authenticated
  USING (true);

-- Writes (insert / update / delete) gated to HR-Hub admins or matrix admins.
-- The combobox "add new" flow runs an INSERT as the signed-in admin user.
CREATE POLICY "Write hr_lookups" ON public.hr_lookups
  FOR ALL TO authenticated
  USING (public.is_matrix_admin() OR public.can_admin_app('hr-hub'))
  WITH CHECK (public.is_matrix_admin() OR public.can_admin_app('hr-hub'));

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT kind, count(*) FROM public.hr_lookups GROUP BY kind ORDER BY kind;
--   -- Should show one row per (department, role, designation) with the
--   -- count of distinct values seeded from existing employees.
--
--   SELECT * FROM public.hr_lookups WHERE kind='department' ORDER BY value;
-- =============================================================================
