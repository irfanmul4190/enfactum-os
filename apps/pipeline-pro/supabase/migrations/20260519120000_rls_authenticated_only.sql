-- =============================================================================
-- 2026-05-19  Tighten RLS: revoke anon write, keep public read.
--
-- The original migration (20260514150830_...) shipped policies named
-- "Anon write *" with FOR ALL TO anon USING (true) WITH CHECK (true). The
-- anon JWT is embedded in the public JS bundle, so anyone could read/write
-- every row via the REST API regardless of UI auth state.
--
-- This migration:
--   1. Drops every "Anon write *" policy.
--   2. Replaces "Auth write *" with a policy that only grants write to
--      authenticated users (FOR INSERT/UPDATE/DELETE TO authenticated).
--   3. Leaves "Public read *" intact for now (the UI is gated by Supabase
--      auth in the OTHER project; the data project sees only anon). If you
--      consolidate Supabase projects later, swap the SELECT policies to
--      `TO authenticated` for stricter access.
--
-- After running this:
--   - Unauthenticated REST callers can still SELECT (e.g. dashboards via the
--     anon key), but cannot INSERT/UPDATE/DELETE.
--   - To enable writes, EITHER consolidate auth into this project, OR move
--     write paths to a Supabase Edge Function with the service-role key.
-- =============================================================================

BEGIN;

-- accounts ---------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write accounts" ON public.accounts;
DROP POLICY IF EXISTS "Auth write accounts" ON public.accounts;
CREATE POLICY "Authenticated insert accounts" ON public.accounts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update accounts" ON public.accounts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete accounts" ON public.accounts
  FOR DELETE TO authenticated USING (true);

-- employees --------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write employees" ON public.employees;
DROP POLICY IF EXISTS "Auth write employees" ON public.employees;
CREATE POLICY "Authenticated insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update employees" ON public.employees
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete employees" ON public.employees
  FOR DELETE TO authenticated USING (true);

-- deals ------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write deals" ON public.deals;
DROP POLICY IF EXISTS "Auth write deals" ON public.deals;
CREATE POLICY "Authenticated insert deals" ON public.deals
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update deals" ON public.deals
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete deals" ON public.deals
  FOR DELETE TO authenticated USING (true);

-- margins ----------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write margins" ON public.margins;
DROP POLICY IF EXISTS "Auth write margins" ON public.margins;
CREATE POLICY "Authenticated insert margins" ON public.margins
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update margins" ON public.margins
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete margins" ON public.margins
  FOR DELETE TO authenticated USING (true);

-- events -----------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write events" ON public.events;
DROP POLICY IF EXISTS "Auth write events" ON public.events;
CREATE POLICY "Authenticated insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update events" ON public.events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete events" ON public.events
  FOR DELETE TO authenticated USING (true);

COMMIT;
