-- =============================================================================
-- 2026-05-22  Add market-grammer to the access matrix.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Market-Grammer previously shipped with no authentication — anyone with the
-- URL could read it. It now uses the same Supabase SSO + employee gate as the
-- other apps, checking employee_app_access for app = 'market-grammer'.
--
-- This migration backfills a 'read' grant for every active employee so the
-- rollout doesn't lock the whole company out. It only inserts where no row
-- exists yet, so admins can pre-set higher levels and re-running is safe.
-- New employees added via the launcher /admin/people matrix are seeded for
-- all apps automatically.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

INSERT INTO public.employee_app_access (employee_id, app, access_level)
SELECT e.id, 'market-grammer', 'read'
  FROM public.employees e
 WHERE e.status = 'active'
   AND NOT EXISTS (
     SELECT 1
       FROM public.employee_app_access a
      WHERE a.employee_id = e.id
        AND a.app = 'market-grammer'
   );

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT count(*) FROM public.employee_app_access WHERE app = 'market-grammer';
--   -- should equal the count of active employees.
-- =============================================================================
