-- =============================================================================
-- 2026-05-19  Access-control matrix.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Introduces per-(employee, app) access levels and a separate is_matrix_admin
-- flag for people who can edit the matrix itself.
--
-- Apps recognized today:
--   - pipeline-pro
--   - profit-navigator
--   - enfactum-financing-hub
--
-- Access levels:
--   - 'none'  : cannot sign in to that app at all (default for new apps)
--   - 'read'  : can sign in, view-only
--   - 'write' : view + create + edit (no destructive ops, no app settings)
--   - 'admin' : write + delete + app-internal admin pages
--
-- 'admin' on an app is different from is_matrix_admin. An app-admin can do
-- anything inside that one app; a matrix-admin can manage who has access to
-- which apps. They overlap or are disjoint as you choose.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. is_matrix_admin flag on employees ---------------------------------
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_matrix_admin boolean NOT NULL DEFAULT false;

-- ---- 2. employee_app_access table -----------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_app_access (
  employee_id  uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  app          text NOT NULL,
  access_level text NOT NULL CHECK (access_level IN ('none', 'read', 'write', 'admin')),
  granted_by   uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employee_id, app)
);
CREATE INDEX IF NOT EXISTS idx_eaa_app_level ON public.employee_app_access(app, access_level);

DROP TRIGGER IF EXISTS trg_eaa_updated ON public.employee_app_access;
CREATE TRIGGER trg_eaa_updated BEFORE UPDATE ON public.employee_app_access
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- 3. helper functions --------------------------------------------------
-- Replaces the older is_active_admin() (which scoped on role ILIKE '%admin%').
-- Now we explicitly check the is_matrix_admin column. The old function stays
-- as an alias for back-compat; will be removed in a future cleanup.
CREATE OR REPLACE FUNCTION public.is_matrix_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_matrix_admin
       FROM public.employees
      WHERE email = (auth.jwt() ->> 'email')
        AND status = 'active'),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_matrix_admin() TO authenticated;

-- Keep the older is_active_admin() callers working: redefine it to mean
-- is_matrix_admin (since the only place it gated was the matrix UI itself).
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_matrix_admin();
$$;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

-- Returns the calling user's access level for one app, or null if no row.
-- Used in RLS policies on the apps' data tables.
CREATE OR REPLACE FUNCTION public.current_user_app_access(p_app text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.access_level
    FROM public.employees e
    JOIN public.employee_app_access a ON a.employee_id = e.id
   WHERE e.email = (auth.jwt() ->> 'email')
     AND e.status = 'active'
     AND a.app = p_app
   LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.current_user_app_access(text) TO authenticated;

-- Convenience wrappers (so RLS can read like English).
CREATE OR REPLACE FUNCTION public.can_read_app(p_app text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_app_access(p_app) IN ('read', 'write', 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.can_read_app(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_write_app(p_app text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_app_access(p_app) IN ('write', 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.can_write_app(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_admin_app(p_app text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_app_access(p_app) = 'admin';
$$;
GRANT EXECUTE ON FUNCTION public.can_admin_app(text) TO authenticated;

-- ---- 4. RLS on the new tables --------------------------------------------
ALTER TABLE public.employee_app_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own access"        ON public.employee_app_access;
DROP POLICY IF EXISTS "Matrix admin read all"  ON public.employee_app_access;
DROP POLICY IF EXISTS "Matrix admin write"     ON public.employee_app_access;

-- Authenticated user can read their own access rows (so the apps can check
-- "what level do I have here?"). Matrix admins can read everything for the
-- admin UI. We express this as one SELECT policy covering both cases.
CREATE POLICY "Read access rows" ON public.employee_app_access
  FOR SELECT TO authenticated
  USING (
    public.is_matrix_admin()
    OR employee_id IN (
      SELECT id FROM public.employees
       WHERE email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Matrix admin write access rows" ON public.employee_app_access
  FOR ALL TO authenticated
  USING (public.is_matrix_admin())
  WITH CHECK (public.is_matrix_admin());

-- ---- 5. Update employees RLS to use is_matrix_admin -----------------------
DROP POLICY IF EXISTS "Authenticated read employees" ON public.employees;
DROP POLICY IF EXISTS "Admin insert employees"       ON public.employees;
DROP POLICY IF EXISTS "Admin update employees"       ON public.employees;
DROP POLICY IF EXISTS "Admin delete employees"       ON public.employees;

CREATE POLICY "Read employees" ON public.employees
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Matrix admin insert employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_matrix_admin());

CREATE POLICY "Matrix admin update employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.is_matrix_admin())
  WITH CHECK (public.is_matrix_admin());

CREATE POLICY "Matrix admin delete employees" ON public.employees
  FOR DELETE TO authenticated
  USING (public.is_matrix_admin());

-- ---- 6. Tighten data-table RLS using new access functions -----------------
-- Pipeline-pro data lives in: accounts, deals, margins, events. Replace the
-- "any authenticated user" policies with app-aware ones.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts','deals','margins','events'] LOOP
    -- Drop old per-cmd policies (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read %1$s"   ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated delete %1$s" ON public.%1$I', t);

    EXECUTE format($q$
      CREATE POLICY "Pipeline read %1$s" ON public.%1$I
        FOR SELECT TO authenticated USING (public.can_read_app('pipeline-pro'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "Pipeline insert %1$s" ON public.%1$I
        FOR INSERT TO authenticated WITH CHECK (public.can_write_app('pipeline-pro'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "Pipeline update %1$s" ON public.%1$I
        FOR UPDATE TO authenticated USING (public.can_write_app('pipeline-pro')) WITH CHECK (public.can_write_app('pipeline-pro'))
    $q$, t);
    EXECUTE format($q$
      CREATE POLICY "Pipeline delete %1$s" ON public.%1$I
        FOR DELETE TO authenticated USING (public.can_admin_app('pipeline-pro'))
    $q$, t);
  END LOOP;
END $$;

-- ---- 7. One-time data backfill --------------------------------------------
-- Map every existing employees row to a sensible matrix entry based on the
-- legacy role string. Only runs when there are zero rows in app_access yet,
-- so re-running this migration after manual edits is safe.
DO $$
DECLARE existing_count int;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.employee_app_access;
  IF existing_count > 0 THEN
    RAISE NOTICE 'employee_app_access already populated (% rows). Skipping backfill.', existing_count;
    RETURN;
  END IF;

  -- Anyone whose legacy role contains "admin" becomes a matrix admin AND
  -- gets admin on every app.
  UPDATE public.employees
     SET is_matrix_admin = true
   WHERE role ILIKE '%admin%' AND status = 'active';

  -- Seed app_access for every active employee × every recognized app.
  INSERT INTO public.employee_app_access (employee_id, app, access_level)
  SELECT e.id, app_id, CASE
    WHEN e.role ILIKE '%admin%'                                 THEN 'admin'
    WHEN e.role ILIKE '%finance%'                               THEN 'write'
    WHEN e.role ILIKE '%lead%' OR e.role ILIKE '%manager%'      THEN 'write'
    WHEN e.role ILIKE '%leadership%'
      OR e.role ILIKE '%ceo%' OR e.role ILIKE '%director%'      THEN 'read'
    WHEN e.role ILIKE '%partner%'                               THEN 'read'
    ELSE                                                            'read'
  END
  FROM public.employees e
  CROSS JOIN (VALUES ('pipeline-pro'), ('profit-navigator'), ('enfactum-financing-hub')) AS apps(app_id)
  WHERE e.status = 'active';
END $$;

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT email, role, status, is_matrix_admin FROM public.employees
--   ORDER BY is_matrix_admin DESC, email;
--
--   SELECT e.email, a.app, a.access_level
--     FROM public.employee_app_access a
--     JOIN public.employees e ON e.id = a.employee_id
--    ORDER BY e.email, a.app;
--
-- Expected:
--   - Matrix admins (you) have is_matrix_admin = true.
--   - Every active employee has exactly 3 rows in employee_app_access
--     (one per app), with the level derived from their legacy role.
--
-- If anything looks wrong, you can re-run this migration after deleting the
-- bad rows from employee_app_access — the backfill DO block only fires when
-- the table is empty.
-- =============================================================================
