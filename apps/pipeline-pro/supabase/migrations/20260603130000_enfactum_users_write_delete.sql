-- =============================================================================
-- 2026-06-03  Let every active @enfactum.com employee add / edit / delete the
--             core Pipeline Pro working data, regardless of their access-matrix
--             level.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Scope: client managers, clients, projects, documents (decks), and the
-- pipeline tables (deals, margins, events), plus the client-documents storage
-- bucket. Reads are unchanged (still can_read_app). App-admin surfaces
-- (Admin Settings, Import) keep using can_admin_app and are NOT affected — this
-- migration never touches is_matrix_admin / can_admin_app for those pages.
--
-- Mechanism: a new is_enfactum_user() helper returns true when the caller's JWT
-- email ends with @enfactum.com and maps to an active employees row. Every
-- write/delete policy below becomes "matrix grant OR is_enfactum_user()".
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. Helper -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_enfactum_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@enfactum.com'
     AND EXISTS (
       SELECT 1
         FROM public.employees e
        WHERE e.email = (auth.jwt() ->> 'email')
          AND e.status = 'active'
     );
$$;
GRANT EXECUTE ON FUNCTION public.is_enfactum_user() TO authenticated;

-- ---- 2. Document library tables (cm_*) ------------------------------------
-- These were created with policy names "<t>_insert/_update/_delete"
-- (see 20260603120000_pipeline_client_document_library.sql).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cm_managers','cm_clients','cm_projects','cm_documents'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated
         WITH CHECK (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated
         USING (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())
         WITH CHECK (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated
         USING (public.can_admin_app(''pipeline-pro'') OR public.is_enfactum_user())',
      t, t);
  END LOOP;
END $$;

-- ---- 3. Pipeline data tables ----------------------------------------------
-- These were created with policy names "Pipeline insert/update/delete <t>"
-- (see 20260519150000_access_matrix.sql).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deals','margins','events'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Pipeline insert %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Pipeline insert %1$s" ON public.%1$I FOR INSERT TO authenticated
         WITH CHECK (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())', t);

    EXECUTE format('DROP POLICY IF EXISTS "Pipeline update %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Pipeline update %1$s" ON public.%1$I FOR UPDATE TO authenticated
         USING (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())
         WITH CHECK (public.can_write_app(''pipeline-pro'') OR public.is_enfactum_user())', t);

    EXECUTE format('DROP POLICY IF EXISTS "Pipeline delete %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Pipeline delete %1$s" ON public.%1$I FOR DELETE TO authenticated
         USING (public.can_admin_app(''pipeline-pro'') OR public.is_enfactum_user())', t);
  END LOOP;
END $$;

-- ---- 4. client-documents storage bucket (uploaded decks) ------------------
DROP POLICY IF EXISTS "client-documents insert" ON storage.objects;
CREATE POLICY "client-documents insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (public.can_write_app('pipeline-pro') OR public.is_enfactum_user())
  );

DROP POLICY IF EXISTS "client-documents update" ON storage.objects;
CREATE POLICY "client-documents update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (public.can_write_app('pipeline-pro') OR public.is_enfactum_user())
  )
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (public.can_write_app('pipeline-pro') OR public.is_enfactum_user())
  );

DROP POLICY IF EXISTS "client-documents delete" ON storage.objects;
CREATE POLICY "client-documents delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (public.can_admin_app('pipeline-pro') OR public.is_enfactum_user())
  );

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT public.is_enfactum_user();   -- true for your own @enfactum.com login
--
--   -- Confirm widened policies exist:
--   SELECT tablename, policyname, cmd
--     FROM pg_policies
--    WHERE schemaname = 'public'
--      AND tablename IN ('cm_managers','cm_clients','cm_projects','cm_documents',
--                        'deals','margins','events')
--    ORDER BY tablename, cmd;
-- =============================================================================
