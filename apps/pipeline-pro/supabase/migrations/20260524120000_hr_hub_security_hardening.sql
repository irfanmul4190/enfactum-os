-- =============================================================================
-- 2026-05-24  HR Hub security hardening.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Three fixes:
--   1. Restrict reads of sensitive employee columns (monthly_ctc,
--      personal_email, phone, payboy_employee_id, insurance_member_id, and
--      five *_folder_url columns) via column-level GRANTs. Pre-fix any
--      @enfactum.com authenticated user could SELECT * FROM employees and
--      pull the entire salary register.
--   2. Provide an RPC public.get_employee_sensitive(p_id uuid) returning
--      those columns IF the caller is the employee themselves, a matrix
--      admin, or has admin access to hr-hub.
--   3. Extend employees write RLS so HR-Hub admins (can_admin_app('hr-hub'))
--      can manage employees without needing matrix-admin too.
--
-- Idempotent: safe to re-run. The column-level GRANT pattern is
-- backward-compatible with all existing apps: PostgREST select('*') silently
-- restricts to readable columns, so no other app needs to change.
-- =============================================================================

BEGIN;

-- ---- 1. Column-level SELECT grants ----------------------------------------
-- Strip the table-wide SELECT, then grant only the non-sensitive columns.
-- anon already has no row-level access via RLS, but revoke for defence in
-- depth so an RLS regression can't leak data either.
REVOKE SELECT ON public.employees FROM authenticated;
REVOKE SELECT ON public.employees FROM anon;

GRANT SELECT (
  id,
  auth_user_id,
  name,
  email,
  role,
  status,
  department,
  designation,
  country,
  location,
  employment_type,
  lifecycle_status,
  employee_code,
  cost_center,
  date_of_joining,
  date_of_exit,
  manager_id,
  is_manager,
  is_finance,
  is_hr_admin,
  is_matrix_admin,
  skills,
  certifications,
  metadata,
  created_at,
  updated_at
) ON public.employees TO authenticated;

-- INSERT / UPDATE / DELETE remain table-level. RLS (re-defined below) decides
-- which authenticated callers can actually run them.
GRANT INSERT, UPDATE, DELETE ON public.employees TO authenticated;

-- ---- 2. RPC for reading sensitive columns ---------------------------------
-- SECURITY DEFINER bypasses the column GRANTs above. Function does the auth
-- check itself: self OR matrix admin OR hr-hub app admin.
DROP FUNCTION IF EXISTS public.get_employee_sensitive(uuid);
CREATE FUNCTION public.get_employee_sensitive(p_id uuid)
RETURNS TABLE (
  employee_id               uuid,
  monthly_ctc               numeric,
  personal_email            text,
  phone                     text,
  payboy_employee_id        text,
  insurance_member_id       text,
  employee_drive_folder_url text,
  payslips_folder_url       text,
  insurance_folder_url      text,
  onboarding_folder_url     text,
  exit_folder_url           text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_email text := (auth.jwt() ->> 'email');
  v_row_email    text;
BEGIN
  SELECT email INTO v_row_email FROM public.employees WHERE id = p_id;
  IF v_row_email IS NULL THEN
    RETURN; -- empty
  END IF;

  IF NOT (
    v_row_email = v_caller_email
    OR public.is_matrix_admin()
    OR public.can_admin_app('hr-hub')
  ) THEN
    RETURN; -- empty (caller not authorized)
  END IF;

  RETURN QUERY
  SELECT e.id,
         e.monthly_ctc,
         e.personal_email,
         e.phone,
         e.payboy_employee_id,
         e.insurance_member_id,
         e.employee_drive_folder_url,
         e.payslips_folder_url,
         e.insurance_folder_url,
         e.onboarding_folder_url,
         e.exit_folder_url
    FROM public.employees e
   WHERE e.id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_employee_sensitive(uuid) TO authenticated;

-- ---- 3. Extend employees write RLS to include HR-Hub admins ---------------
-- Previously only is_matrix_admin() could insert/update/delete employees.
-- HR-Hub admins (per the access matrix) should also be able to manage HR
-- data — otherwise nobody can use the HR Hub UI without also being a matrix
-- admin (over-privileged).
DROP POLICY IF EXISTS "Admin insert employees"        ON public.employees;
DROP POLICY IF EXISTS "Admin update employees"        ON public.employees;
DROP POLICY IF EXISTS "Admin delete employees"        ON public.employees;
DROP POLICY IF EXISTS "Matrix admin insert employees" ON public.employees;
DROP POLICY IF EXISTS "Matrix admin update employees" ON public.employees;
DROP POLICY IF EXISTS "Matrix admin delete employees" ON public.employees;

CREATE POLICY "HR or matrix admin insert employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_matrix_admin() OR public.can_admin_app('hr-hub'));

CREATE POLICY "HR or matrix admin update employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.is_matrix_admin() OR public.can_admin_app('hr-hub'))
  WITH CHECK (public.is_matrix_admin() OR public.can_admin_app('hr-hub'));

CREATE POLICY "HR or matrix admin delete employees" ON public.employees
  FOR DELETE TO authenticated
  USING (public.is_matrix_admin() OR public.can_admin_app('hr-hub'));

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   -- 1. Confirm sensitive columns are not readable for non-admins:
--   --    SELECT column_name FROM information_schema.column_privileges
--   --    WHERE grantee='authenticated' AND table_name='employees' AND privilege_type='SELECT'
--   --    ORDER BY column_name;
--   --    Should NOT include monthly_ctc, personal_email, phone,
--   --    payboy_employee_id, insurance_member_id, *_folder_url.
--
--   -- 2. As a normal authenticated user (use the dashboard "Auth" tester):
--   --    SELECT * FROM public.employees LIMIT 1;
--   --    Result: NO monthly_ctc / phone / personal_email column in response.
--
--   -- 3. SELECT * FROM public.get_employee_sensitive('<your own id>');
--   --    Result: 1 row with your own sensitive data.
--
--   -- 4. Grant yourself admin on hr-hub via /admin/people, then
--   --    SELECT * FROM public.get_employee_sensitive('<someone else>'s id);
--   --    Result: 1 row.
-- =============================================================================
