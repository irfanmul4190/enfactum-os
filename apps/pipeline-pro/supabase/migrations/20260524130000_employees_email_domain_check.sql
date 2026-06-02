-- =============================================================================
-- 2026-05-24  Employees email-domain CHECK constraint.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Defence-in-depth: the auth gate already rejects sign-ins from non-Enfactum
-- emails, but nothing prevented an admin from typo'ing
-- 'alice@enfactum.con' into the employees table via the HR Hub form. That
-- row would silently fail to sign in forever. This CHECK constraint catches
-- it at the database, regardless of which UI is writing.
--
-- Idempotent: skips if already present.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
     WHERE c.conname  = 'employees_email_enfactum_domain'
       AND t.relname  = 'employees'
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_email_enfactum_domain
      CHECK (email ~* '@enfactum\.com$') NOT VALID;

    -- Validate against existing rows. If any row violates this (a typo
    -- snuck in earlier), the VALIDATE will fail and you'll need to clean
    -- those rows up before re-running. The NOT VALID + VALIDATE split lets
    -- you see exactly which row is bad.
    ALTER TABLE public.employees
      VALIDATE CONSTRAINT employees_email_enfactum_domain;
  END IF;
END $$;
