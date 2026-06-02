-- =============================================================================
-- 2026-05-27  MDF Central follow-ups: fix enum drift, seed permission tables,
--             backfill team_members from employees, fix creative_approvals
--             default status.
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Why each piece:
--   1. activities.bu was created as the `business_unit` enum from Lovable's
--      types.ts ('PC','Print','HPS','Workstation','Consumer','Commercial'),
--      but the UI's constants.ts ships a different value list ('PC Commercial',
--      'PC Consumer','HPS','OPS','Services','ACS','Poly'). Any CreateActivity
--      submission would fail with "invalid input value for enum". Easiest fix:
--      drop the enum constraint on the column (text). `bu_array text[]` was
--      already free-form so it works.
--   2. creative_approvals.status default 'Pending' didn't match the UI filter
--      which queries 'Pending Review'. Switch the default.
--   3. role_permissions is empty in fresh installs → every flag is false →
--      Agency Directors can't edit budget, view margin, approve POE, etc.
--      Seed one row per app_role with sensible defaults.
--   4. team_members empty → useSidebarNavigation's getTeamType returns
--      'Unknown' for every user → useRouteAccess blocks all routes except
--      Dashboard/Activities/Resources. Backfill from public.employees so any
--      active employee gets at least a 'Project Lead' / 'Other' team-member
--      record; matrix-admins promoted to Agency Director / Director Team.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. Drop enum on activities.bu (UI sends values outside the enum) -----
ALTER TABLE public.activities
  ALTER COLUMN bu TYPE text USING bu::text;

-- ---- 2. Fix creative_approvals.status default ------------------------------
ALTER TABLE public.creative_approvals
  ALTER COLUMN status SET DEFAULT 'Pending Review';

-- ---- 3. Seed role_permissions ---------------------------------------------
INSERT INTO public.role_permissions
  (role, can_edit_budget, can_view_margin, can_approve_poe, can_mark_paid, can_delete_activity, can_view_all_regions)
VALUES
  ('Super Admin',     true,  true,  true,  true,  true,  true),
  ('Agency Director', true,  true,  true,  true,  true,  true),
  ('Ops',             false, false, true,  true,  false, true),
  ('Project Lead',    true,  false, false, false, false, false),
  ('PMM',             false, false, false, false, false, false),
  ('PBM',             false, false, false, false, false, false),
  ('Partner',         false, false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- ---- 4. Backfill team_members from public.employees -----------------------
-- For every active employee that doesn't already have a team_members row
-- (matched by email, case-insensitive), insert one. Matrix-admins go in as
-- Agency Director / Director Team; everyone else defaults to Project Lead /
-- Other so they at least see the project-team sidebar.
INSERT INTO public.team_members (email, full_name, role, team, is_active)
SELECT
  e.email,
  COALESCE(NULLIF(e.name, ''), split_part(e.email, '@', 1)) AS full_name,
  CASE WHEN e.is_matrix_admin THEN 'Agency Director' ELSE 'Project Lead' END AS role,
  CASE WHEN e.is_matrix_admin THEN 'Director Team' ELSE 'Other' END AS team,
  true
  FROM public.employees e
 WHERE e.status = 'active'
   AND NOT EXISTS (
     SELECT 1 FROM public.team_members t
      WHERE lower(t.email) = lower(e.email)
   );

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT count(*) FROM public.role_permissions;  -- expect 7
--   SELECT role, team, count(*) FROM public.team_members GROUP BY role, team;
--   SELECT pg_typeof(bu) FROM public.activities LIMIT 1;  -- should be 'text'
--   SELECT column_default FROM information_schema.columns
--    WHERE table_name='creative_approvals' AND column_name='status';
--    -- should be 'Pending Review'::text
--
-- Admin promotion: after this runs, the user can sign in and immediately see
-- the full Director sidebar if they were marked is_matrix_admin in
-- public.employees. Other employees land as Project Lead.
-- =============================================================================
