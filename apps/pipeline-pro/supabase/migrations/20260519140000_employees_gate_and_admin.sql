-- =============================================================================
-- 2026-05-19  Employees-table gate + admin RLS + status column wiring.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- What this does:
--   1. Defines public.is_active_admin() — a SECURITY DEFINER function that
--      returns true iff the JWT's email belongs to an active admin. Used by
--      RLS policies on the employees table to scope writes.
--   2. Resets RLS policies on public.employees:
--        - any authenticated user can SELECT (so the apps can fetch their
--          own row, and the admin UI can list everyone)
--        - only active admins can INSERT/UPDATE/DELETE
--   3. The status column already exists (added in 20260519130000_*.sql with
--      a 'active' default). No schema change here — just policies.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- helper: is the current user an active admin? -------------------------
-- SECURITY DEFINER so the inner SELECT bypasses RLS (would otherwise recurse
-- since this is used in RLS on the same table).
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.employees
     WHERE email = (auth.jwt() ->> 'email')
       AND role ILIKE '%admin%'
       AND status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

-- ---- employees RLS --------------------------------------------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop any legacy policies (idempotent re-run support).
DROP POLICY IF EXISTS "Public read employees"        ON public.employees;
DROP POLICY IF EXISTS "Anon write employees"         ON public.employees;
DROP POLICY IF EXISTS "Auth write employees"         ON public.employees;
DROP POLICY IF EXISTS "Authenticated read employees" ON public.employees;
DROP POLICY IF EXISTS "Admin insert employees"       ON public.employees;
DROP POLICY IF EXISTS "Admin update employees"       ON public.employees;
DROP POLICY IF EXISTS "Admin delete employees"       ON public.employees;

-- Reads: any authenticated user. Needed so the apps can do
--   `SELECT * FROM employees WHERE email = <self>` during sign-in,
-- and so the admin UI can list everyone.
CREATE POLICY "Authenticated read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- Writes: only callers where is_active_admin() returns true.
CREATE POLICY "Admin insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admin update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

CREATE POLICY "Admin delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.is_active_admin());

-- ---- bootstrap first admin -----------------------------------------------
-- If the employees table is currently empty (no admin can write yet), uncomment
-- and edit one of these and run separately AFTER this migration. Because the
-- INSERT policy requires being an admin already, you can't add the first
-- admin through the policy — do it with the table editor (which uses the
-- service-role key) OR temporarily as postgres.
--
--   INSERT INTO public.employees (name, email, role, status)
--   VALUES ('You', 'your-email@enfactum.com', 'admin', 'active');

COMMIT;

-- Sanity check (run after COMMIT):
--   SELECT policyname, roles, cmd FROM pg_policies
--   WHERE schemaname='public' AND tablename='employees'
--   ORDER BY policyname;
-- Expected:
--   Admin delete employees     | {authenticated} | DELETE
--   Admin insert employees     | {authenticated} | INSERT
--   Admin update employees     | {authenticated} | UPDATE
--   Authenticated read employees | {authenticated} | SELECT
