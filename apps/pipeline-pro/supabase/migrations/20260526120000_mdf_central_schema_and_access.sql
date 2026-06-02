-- =============================================================================
-- 2026-05-26  MDF Central onboarding: data schema + RLS + register
--             'enfactum-mdf-central' app in the access matrix.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- What this does:
--   1. Creates 16 enums + 18 tables that back the MDF Central Lovable codebase
--      (mirrors apps/enfactum-mdf-central/src/integrations/supabase/types.ts).
--   2. Adds two SECURITY DEFINER helpers (has_role, get_user_markets) the app
--      already calls from its code.
--   3. RLS: every public read requires can_read_app('enfactum-mdf-central');
--      every write requires can_write_app(...); destructive ops require
--      can_admin_app(...). Lookup-style tables (role_permissions) are
--      authenticated-read so the app's permissions hook works for everyone
--      who passed the gate.
--   4. Backfills employee_app_access with 'read' on 'enfactum-mdf-central' for
--      every active employee (same rollout pattern as market-grammer / hr-hub).
--
-- Idempotent: safe to re-run. CREATE TYPE / TABLE / POLICY are guarded.
-- =============================================================================

BEGIN;

-- ---- 1. Enums --------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.activity_status AS ENUM (
    'Not Started','Planning','Executing','Completed','Claiming','POE Submitted','Paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_status_v2 AS ENUM (
    'Briefing','Alignment','Executing','POE Collection','Review','Synced'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_status_v3 AS ENUM (
    'Not Start','Planning','Executing','Activity Completed','Claiming',
    'POE Submitted','Payment Documentation','Payment Submitted','Paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM (
    'Digital Paid Media and Broadcast','Sales Incentives','Events and Training',
    'Telemarketing','Print Marketing','Customer Assessment','Digital Amplifier',
    'In-Store Fixture','Retail Product Packaging','Retail Activation & Merchandising',
    'e-Tail Vendor Service'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'Agency Director','Ops','Project Lead','PMM','PBM','Partner','Super Admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.business_unit AS ENUM (
    'PC','Print','HPS','Workstation','Consumer','Commercial'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.funding_source AS ENUM ('HP','Intel','AMD','Mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.onboarding_status AS ENUM ('Pending','In Progress','Complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_type AS ENUM ('Distributor','Reseller');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.poe_category AS ENUM (
    'Event','Digital','Incentive','Retail','Training','Content'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.poe_status AS ENUM ('Pending','Approved','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('Draft','Active','Completed','On Hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_category AS ENUM (
    'MDF Contracts','Brand Guidelines','Strategic Assets',
    'Alliance Partners','General Resources'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_file_type AS ENUM (
    'pdf','sheets','slides','docs','folder','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vendor_role AS ENUM ('Primary','Secondary','Support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vendor_type AS ENUM (
    'Distributor','Reseller','Agency','Event Company','Print House',
    'Digital Agency','Media Agency','Production House','Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- 2. Tables (in dependency order) ---------------------------------------

CREATE TABLE IF NOT EXISTS public.clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  market          text NOT NULL,
  funding_source  text,
  contract_url    text,
  logo_url        text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partners (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  market                      text NOT NULL,
  type                        public.partner_type NOT NULL,
  onboarding_status           public.onboarding_status NOT NULL DEFAULT 'Pending',
  logo_url                    text,
  brand_assets_url            text,
  brand_guidelines_uploaded   boolean DEFAULT false,
  meta_pixel_id               text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        text NOT NULL,
  market                      text NOT NULL,
  type                        public.vendor_type NOT NULL,
  onboarding_status           public.onboarding_status NOT NULL DEFAULT 'Pending',
  is_active                   boolean NOT NULL DEFAULT true,
  contact_name                text,
  contact_email               text,
  phone                       text,
  logo_url                    text,
  services                    text[],
  brand_guidelines_uploaded   boolean DEFAULT false,
  meta_pixel_id               text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  full_name           text NOT NULL,
  role                text NOT NULL DEFAULT 'Partner',
  team                text NOT NULL,
  accessible_regions  text[],
  is_active           boolean DEFAULT true,
  user_id             uuid,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_email_unique ON public.team_members(lower(email));

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  email       text,
  full_name   text,
  team        text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON public.profiles(user_id);

CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  market          text NOT NULL,
  description     text,
  status          public.project_status NOT NULL DEFAULT 'Draft',
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_lead_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  start_date      date,
  end_date        date,
  total_budget    numeric,
  currency        text NOT NULL DEFAULT 'USD',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id             text NOT NULL,
  name                    text NOT NULL,
  description             text,
  activity_type           public.activity_type,
  bu                      public.business_unit NOT NULL,
  bu_array                text[],
  market                  text NOT NULL,
  funding_source          public.funding_source NOT NULL,
  status                  public.activity_status NOT NULL DEFAULT 'Not Started',
  status_v3               public.activity_status_v3,
  approved_budget         numeric NOT NULL,
  currency                text NOT NULL DEFAULT 'USD',
  fiscal_quarter          text,
  execution_start_date    date,
  execution_end_date      date,
  claim_deadline          date,
  hp_approval_email_url   text,
  pbm_names               text[],
  pdg_synced              boolean DEFAULT false,
  client_id               uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  partner_id              uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  project_id              uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to             uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_pmm_id         uuid,
  project_lead_id         uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_activity_id ON public.activities(activity_id);

CREATE TABLE IF NOT EXISTS public.activity_stakeholders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id         uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  stakeholder_name    text NOT NULL,
  stakeholder_role    text NOT NULL,
  stakeholder_email   text,
  user_id             uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_timeline (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id         uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  event_type          text NOT NULL,
  event_description   text NOT NULL,
  event_date          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_vendors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id         uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  role                public.vendor_role NOT NULL DEFAULT 'Primary',
  budget_allocation   numeric,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id                 uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  current_tier                int NOT NULL DEFAULT 1,
  project_lead_approved       boolean DEFAULT false,
  project_lead_approved_at    timestamptz,
  ops_approved                boolean DEFAULT false,
  ops_approved_at             timestamptz,
  director_approved           boolean DEFAULT false,
  director_approved_at        timestamptz,
  pdg_synced                  boolean DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creative_approvals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id         uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  asset_name          text NOT NULL,
  asset_type          text NOT NULL,
  asset_url           text,
  status              text NOT NULL DEFAULT 'Pending',
  priority            text,
  reviewer_id         uuid,
  revision_notes      text,
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financials (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id              uuid NOT NULL UNIQUE REFERENCES public.activities(id) ON DELETE CASCADE,
  approved_budget          numeric NOT NULL,
  actual_cost              numeric,
  currency                 text NOT NULL DEFAULT 'USD',
  claim_deadline           date,
  poc_required             boolean DEFAULT false,
  deviation_explanation    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poe_records (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id              uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  checklist_type           text NOT NULL,
  status                   text NOT NULL DEFAULT 'Pending',
  file_url                 text,
  sku_list                 jsonb,
  weekly_sales_reports     jsonb,
  comments                 text,
  submitted_by             uuid,
  submitted_at             timestamptz,
  reviewed_by              uuid,
  reviewed_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poe_submissions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id         uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  category            public.poe_category NOT NULL,
  checklist_json      jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_attachments    jsonb,
  status              public.poe_status NOT NULL DEFAULT 'Pending',
  ops_comments        text,
  submitted_by        uuid,
  submitted_at        timestamptz,
  reviewed_by         uuid,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  category            public.resource_category NOT NULL,
  file_type           public.resource_file_type NOT NULL DEFAULT 'other',
  drive_link          text,
  display_order       int NOT NULL DEFAULT 0,
  is_partner_facing   boolean NOT NULL DEFAULT false,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role                     public.app_role NOT NULL UNIQUE,
  can_edit_budget          boolean DEFAULT false,
  can_view_margin          boolean DEFAULT false,
  can_approve_poe          boolean DEFAULT false,
  can_mark_paid            boolean DEFAULT false,
  can_delete_activity      boolean DEFAULT false,
  can_view_all_regions     boolean DEFAULT false,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  role            public.app_role NOT NULL,
  market_access   text[],
  partner_id      uuid REFERENCES public.partners(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- ---- 3. SECURITY DEFINER helpers used by the app code ----------------------

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_markets(_user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT market_access FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    ARRAY[]::text[]
  );
$$;

-- ---- 4. RLS ----------------------------------------------------------------
-- Every table is gated by access matrix on the 'enfactum-mdf-central' app.
-- Reads require can_read_app, writes require can_write_app, deletes require
-- can_admin_app. (can_read_app / can_write_app / can_admin_app are defined in
-- 20260519150000_access_matrix.sql.)

DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'clients','partners','vendors','team_members','profiles','projects',
  'activities','activity_stakeholders','activity_timeline','activity_vendors',
  'approval_workflows','creative_approvals','financials','poe_records',
  'poe_submissions','resources','role_permissions','user_roles'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (public.can_read_app(''enfactum-mdf-central''))',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_write_app(''enfactum-mdf-central''))',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_write_app(''enfactum-mdf-central'')) WITH CHECK (public.can_write_app(''enfactum-mdf-central''))',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_admin_app(''enfactum-mdf-central''))',
      t, t
    );
  END LOOP;
END $$;

-- ---- 5. Backfill 'enfactum-mdf-central' access for all active employees ----
INSERT INTO public.employee_app_access (employee_id, app, access_level)
SELECT e.id, 'enfactum-mdf-central', 'read'
  FROM public.employees e
 WHERE e.status = 'active'
   AND NOT EXISTS (
     SELECT 1
       FROM public.employee_app_access a
      WHERE a.employee_id = e.id
        AND a.app = 'enfactum-mdf-central'
   );

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   SELECT count(*) FROM public.employee_app_access WHERE app = 'enfactum-mdf-central';
--   -- should equal the count of active employees.
--
--   \dt public.*
--   -- should include the 18 new MDF Central tables.
--
-- Admin promotion: launchers /admin/people matrix now lists MDF Central as a
-- column. Promote MDF admins to 'admin' or 'write' via that UI.
-- =============================================================================
