-- =============================================================================
-- 2026-05-25  Drop NOT NULL on employees.role.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Symptom: launcher /admin/people Add form fails with
--   "null value in column \"role\" of relation \"employees\" violates not-null constraint"
-- whenever an admin tries to add someone without typing a role.
--
-- Cause: legacy `role` column was added as NOT NULL when the table was first
-- created (back when role was the gate). Since the access-matrix refactor on
-- 2026-05-19 the role string is no longer load-bearing — `is_matrix_admin`
-- + `employee_app_access` + `is_hr_admin` etc. carry the actual permissions.
-- The launcher's addEmployee() in apps/launcher/src/lib/employees.ts already
-- passes `role: input.role ?? null` assuming nullability; the DB hadn't
-- caught up.
--
-- This migration relaxes the constraint. No data migration needed — existing
-- rows already have non-null values; new rows can omit it.
--
-- Idempotent: skips if already nullable.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'employees'
       AND column_name = 'role'
       AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.employees ALTER COLUMN role DROP NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- Sanity check (run after):
--   SELECT column_name, is_nullable
--     FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='employees' AND column_name='role';
--   -- is_nullable should be 'YES'.
-- =============================================================================
