-- Contract Craft (enforge-contract-craft) — schema + access wiring.
--
-- The original Lovable migration also created accounts/employees/deals/events,
-- but those already exist in the consolidated `dfzmkxkyqtyqntvmzcpt` project
-- with extended schema (status, is_matrix_admin, designation, HR columns, …).
-- We re-use them as-is and only introduce the truly new pieces:
--   - public.contracts                (header + signing metadata)
--   - public.user_settings            (per-user UX preferences, self-only)
--   - public.v_contracts              (joined view used by list/detail pages)
--   - storage bucket "contract-documents" with RLS gated on the access matrix
--
-- All RLS scoped to the per-app access matrix (`can_read_app`/`can_write_app`/
-- `can_admin_app`) so the app id `enforge-contract-craft` controls everything.
-- Idempotent: safe to re-run.

-- ─────────────────────────── public.contracts ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Other',
  status TEXT NOT NULL DEFAULT 'draft',
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  value NUMERIC,
  currency TEXT DEFAULT 'SGD',
  payment_terms TEXT,
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  renewal_date DATE,
  scope_summary TEXT,
  deliverables JSONB,
  client_signer_name TEXT,
  client_signer_email TEXT,
  enfactum_signer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  internal_notes TEXT,
  file_url TEXT,
  signed_file_url TEXT,
  signed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If the table pre-existed (e.g. a prior Lovable migration created a sparser
-- shape), bring it up to the full schema. ADD COLUMN IF NOT EXISTS is a
-- no-op when the column already matches.
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Other';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS value NUMERIC;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SGD';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS scope_summary TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deliverables JSONB;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_signer_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_signer_email TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS enfactum_signer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_file_url TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_account_id ON public.contracts(account_id);
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id ON public.contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_read" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;

CREATE POLICY "contracts_read"
  ON public.contracts FOR SELECT TO authenticated
  USING (public.can_read_app('enforge-contract-craft'));

CREATE POLICY "contracts_insert"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (public.can_write_app('enforge-contract-craft'));

CREATE POLICY "contracts_update"
  ON public.contracts FOR UPDATE TO authenticated
  USING (public.can_write_app('enforge-contract-craft'))
  WITH CHECK (public.can_write_app('enforge-contract-craft'));

CREATE POLICY "contracts_delete"
  ON public.contracts FOR DELETE TO authenticated
  USING (public.can_admin_app('enforge-contract-craft'));

-- Keep updated_at fresh on UPDATE.
CREATE OR REPLACE FUNCTION public.touch_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.touch_contracts_updated_at();

-- ─────────────────────────── public.v_contracts ─────────────────────────────
-- security_invoker so RLS on contracts/accounts/deals/employees is still
-- enforced when reading from the view.
DROP VIEW IF EXISTS public.v_contracts;
CREATE VIEW public.v_contracts WITH (security_invoker = on) AS
SELECT
  c.id,
  c.title,
  c.type,
  c.status,
  c.value,
  c.currency,
  c.start_date,
  c.end_date,
  c.auto_renew,
  c.renewal_date,
  a.name AS account_name,
  c.account_id,
  c.deal_id,
  d.title AS deal_title,
  e.name AS owner_name,
  c.owner_id,
  c.scope_summary,
  c.deliverables,
  c.payment_terms,
  c.client_signer_name,
  c.client_signer_email,
  c.enfactum_signer_id,
  c.internal_notes,
  c.file_url,
  c.signed_file_url,
  c.signed_at,
  c.created_at,
  c.updated_at,
  c.metadata
FROM public.contracts c
LEFT JOIN public.accounts a ON a.id = c.account_id
LEFT JOIN public.deals d ON d.id = c.deal_id
LEFT JOIN public.employees e ON e.id = c.owner_id
WHERE c.status != 'deleted';

-- ─────────────────────────── public.user_settings ───────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notify_status_changes BOOLEAN NOT NULL DEFAULT true,
  notify_expiring_contracts BOOLEAN NOT NULL DEFAULT true,
  notify_new_assignments BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'SGD',
  date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
  default_contract_duration TEXT NOT NULL DEFAULT '12',
  auto_save_drafts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_status_changes BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_expiring_contracts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_new_assignments BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_weekly_digest BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SGD';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'dd/MM/yyyy';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS default_contract_duration TEXT NOT NULL DEFAULT '12';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS auto_save_drafts BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_self_read" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_self_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_self_update" ON public.user_settings;

-- Self-only — settings are per-(auth.user). Access to Contract Craft is still
-- required so we add the matrix check; without it, a user could read/write
-- their own row even if they lost ECC access. Cheap belt-and-braces.
CREATE POLICY "user_settings_self_read"
  ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.can_read_app('enforge-contract-craft'));

CREATE POLICY "user_settings_self_insert"
  ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_read_app('enforge-contract-craft'));

CREATE POLICY "user_settings_self_update"
  ON public.user_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.can_read_app('enforge-contract-craft'))
  WITH CHECK (user_id = auth.uid() AND public.can_read_app('enforge-contract-craft'));

-- ─────────────────────────── storage bucket ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Contract docs read" ON storage.objects;
DROP POLICY IF EXISTS "Contract docs insert" ON storage.objects;
DROP POLICY IF EXISTS "Contract docs delete" ON storage.objects;

CREATE POLICY "Contract docs read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contract-documents'
    AND public.can_read_app('enforge-contract-craft')
  );

CREATE POLICY "Contract docs insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contract-documents'
    AND public.can_write_app('enforge-contract-craft')
  );

CREATE POLICY "Contract docs delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'contract-documents'
    AND public.can_admin_app('enforge-contract-craft')
  );

-- ─────────────────────────── access matrix backfill ─────────────────────────
-- Grant 'read' on enforge-contract-craft to every currently-active employee.
-- Matches the pattern used for hr-hub / market-grammer / enfactum-mdf-central.
INSERT INTO public.employee_app_access (employee_id, app, access_level)
SELECT id, 'enforge-contract-craft', 'read'
FROM public.employees
WHERE status = 'active'
ON CONFLICT (employee_id, app) DO NOTHING;
