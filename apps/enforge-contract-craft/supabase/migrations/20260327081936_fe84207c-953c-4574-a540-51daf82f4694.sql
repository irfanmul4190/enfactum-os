
-- 1. Accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read accounts" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT,
  department TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update employees" ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 3. Deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'open',
  value NUMERIC,
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update deals" ON public.deals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Contracts table
CREATE TABLE public.contracts (
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
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete contracts" ON public.contracts FOR DELETE TO authenticated USING (true);

-- 5. Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);

-- 6. v_contracts view
CREATE OR REPLACE VIEW public.v_contracts WITH (security_invoker = on) AS
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
  c.metadata
FROM public.contracts c
LEFT JOIN public.accounts a ON a.id = c.account_id
LEFT JOIN public.deals d ON d.id = c.deal_id
LEFT JOIN public.employees e ON e.id = c.owner_id
WHERE c.status != 'deleted';

-- 7. Indexes for performance
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_account_id ON public.contracts(account_id);
CREATE INDEX idx_contracts_deal_id ON public.contracts(deal_id);
CREATE INDEX idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX idx_events_module ON public.events(module);
CREATE INDEX idx_employees_email ON public.employees(email);
