
-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- accounts
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  industry text,
  tier text,
  vendor_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  website text,
  primary_contact_name text,
  primary_contact_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- employees
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text,
  department text,
  status text NOT NULL DEFAULT 'active',
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- deals
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  stage text,
  value numeric,
  currency text DEFAULT 'SGD',
  win_probability numeric,
  expected_close_date date,
  actual_close_date date,
  loss_reason text,
  mdf_eligible boolean DEFAULT false,
  mdf_amount numeric,
  product_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_account ON public.deals(account_id);
CREATE INDEX idx_deals_owner ON public.deals(owner_id);
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- margins
CREATE TABLE public.margins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  revenue numeric,
  cost_of_goods numeric,
  cost_of_services numeric,
  mdf_subsidy numeric,
  gross_profit numeric,
  gp_percent numeric,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_margins_updated BEFORE UPDATE ON public.margins
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text,
  entity_type text,
  entity_id uuid,
  event_type text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX idx_events_module_occurred ON public.events(module, occurred_at DESC);

-- v_deals view
CREATE OR REPLACE VIEW public.v_deals AS
SELECT
  d.id,
  d.title,
  d.description,
  d.stage,
  d.value,
  d.currency,
  d.win_probability,
  d.expected_close_date,
  d.actual_close_date,
  d.mdf_eligible,
  d.mdf_amount,
  d.product_lines,
  d.account_id,
  a.name AS account_name,
  a.industry,
  a.tier,
  a.vendor_flags AS account_vendor_flags,
  d.owner_id,
  e.name AS owner_name,
  e.email AS owner_email,
  m.revenue AS margin_revenue,
  m.gross_profit AS margin_gp,
  m.gp_percent AS margin_gp_percent,
  m.approved AS margin_approved,
  m.revenue,
  m.cost_of_goods,
  m.cost_of_services,
  m.mdf_subsidy,
  m.gross_profit,
  m.gp_percent,
  d.created_at AS deal_created_at,
  d.updated_at AS deal_updated_at
FROM public.deals d
LEFT JOIN public.accounts a ON a.id = d.account_id
LEFT JOIN public.employees e ON e.id = d.owner_id
LEFT JOIN public.margins m ON m.deal_id = d.id;

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Permissive policies: any visitor can read; authenticated users can write.
CREATE POLICY "Public read accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Auth write accounts" ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon write accounts" ON public.accounts FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Auth write employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon write employees" ON public.employees FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read deals" ON public.deals FOR SELECT USING (true);
CREATE POLICY "Auth write deals" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon write deals" ON public.deals FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read margins" ON public.margins FOR SELECT USING (true);
CREATE POLICY "Auth write margins" ON public.margins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon write margins" ON public.margins FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Auth write events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon write events" ON public.events FOR ALL TO anon USING (true) WITH CHECK (true);
