-- =============================================================================
-- 2026-05-23  HR Hub onboarding: extend employees + register 'hr-hub' app.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- What this does:
--   1. Adds HR-Hub-specific columns to public.employees so the existing table
--      stays the single source of truth for everything People-related (admin
--      /people, profit-navigator, financing-hub, AND now HR Hub). All columns
--      are nullable / have defaults so existing rows aren't disrupted.
--   2. Backfills employee_app_access with a 'read' grant on 'hr-hub' for every
--      active employee — same rollout strategy as the market-grammer migration
--      so nobody is locked out on first deploy.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. extend public.employees with HR fields ----------------------------
-- Identity / lifecycle
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_code       text,
  ADD COLUMN IF NOT EXISTS designation         text,
  ADD COLUMN IF NOT EXISTS country             text,
  ADD COLUMN IF NOT EXISTS location            text,
  ADD COLUMN IF NOT EXISTS employment_type     text,
  ADD COLUMN IF NOT EXISTS lifecycle_status    text,
  ADD COLUMN IF NOT EXISTS personal_email      text,
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS manager_id          uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_of_joining     date,
  ADD COLUMN IF NOT EXISTS date_of_exit        date,
  ADD COLUMN IF NOT EXISTS cost_center         text,
  ADD COLUMN IF NOT EXISTS monthly_ctc         numeric,
  -- HR flags. is_matrix_admin already exists; these are HR-Hub-local flags
  -- so the matrix can grant per-app admin separately from HR roles.
  ADD COLUMN IF NOT EXISTS is_manager          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_finance          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hr_admin         boolean NOT NULL DEFAULT false,
  -- Optional integrations
  ADD COLUMN IF NOT EXISTS payboy_employee_id  text,
  ADD COLUMN IF NOT EXISTS insurance_member_id text,
  ADD COLUMN IF NOT EXISTS certifications      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Drive folders
  ADD COLUMN IF NOT EXISTS employee_drive_folder_url text,
  ADD COLUMN IF NOT EXISTS payslips_folder_url       text,
  ADD COLUMN IF NOT EXISTS insurance_folder_url      text,
  ADD COLUMN IF NOT EXISTS onboarding_folder_url     text,
  ADD COLUMN IF NOT EXISTS exit_folder_url           text;

-- Useful index for manager → reports lookup.
CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(manager_id);

-- ---- 2. backfill 'hr-hub' access for all active employees -----------------
INSERT INTO public.employee_app_access (employee_id, app, access_level)
SELECT e.id, 'hr-hub', 'read'
  FROM public.employees e
 WHERE e.status = 'active'
   AND NOT EXISTS (
     SELECT 1
       FROM public.employee_app_access a
      WHERE a.employee_id = e.id
        AND a.app = 'hr-hub'
   );

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT count(*) FROM public.employee_app_access WHERE app = 'hr-hub';
--   -- should equal the count of active employees.
--
--   \d public.employees
--   -- should show the new HR columns alongside the existing gate columns.
--
-- HR admins (people with full write on HR Hub) should be upgraded manually via
-- the launcher /admin/people matrix once that UI lists 'hr-hub' as a column.
-- =============================================================================
