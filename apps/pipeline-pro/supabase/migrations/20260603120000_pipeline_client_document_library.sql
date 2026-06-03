-- =============================================================================
-- 2026-06-03  Pipeline Pro: Client Document Library.
--
-- WHERE TO RUN: dfzmkxkyqtyqntvmzcpt (the consolidated project).
--
-- Adds a 4-level document store, organised as:
--
--     Client Manager (name, email, mobile)
--       └─ Client (name)
--            └─ Project (name)
--                 └─ Document  (uploaded file OR external link)
--
-- e.g.  Phil Tan / ptan@lenovo.com / +65xxxxxxx
--          └─ Lenovo
--               └─ Q1 Campaign
--                    └─ pitch.pdf, deck.pptx, brief.docx,
--                       https://docs.google.com/…  (Google Docs / Slides)
--
-- Documents can be either an uploaded file (PDF / PPT / Word / Excel / …) that
-- lives in the private `client-documents` storage bucket, OR a link to an
-- external doc (Google Docs, Google Slides, SharePoint, …).
--
-- A flattened view `v_cm_documents` exposes manager / client / project names
-- alongside each document so the front end can search by any of the three.
--
-- Access is governed by the existing access matrix
-- (see 20260519150000_access_matrix.sql):
--   read   → can_read_app('pipeline-pro')
--   write  → can_write_app('pipeline-pro')
--   delete → can_admin_app('pipeline-pro')
--
-- Tables are prefixed `cm_` (client-manager) so they do NOT collide with the
-- MDF Central `clients` / `projects` tables that already live in this schema.
--
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ---- 1. Client Managers ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_managers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  mobile      text,
  created_by  uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- One manager row per email (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cm_managers_email_unique
  ON public.cm_managers (lower(email));

-- ---- 2. Clients (belong to a manager) -------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id  uuid NOT NULL REFERENCES public.cm_managers(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cm_clients_manager ON public.cm_clients (manager_id);
-- A client name is unique within one manager.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cm_clients_manager_name_unique
  ON public.cm_clients (manager_id, lower(name));

-- ---- 3. Projects (belong to a client) -------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cm_projects_client ON public.cm_projects (client_id);
-- A project name is unique within one client.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cm_projects_client_name_unique
  ON public.cm_projects (client_id, lower(name));

-- ---- 4. Documents (belong to a project) -----------------------------------
-- `source` distinguishes an uploaded file from an external link.
--   'upload' → file_path points at an object in the `client-documents` bucket.
--   'link'   → link_url holds an external URL (Google Docs / Slides / …).
CREATE TABLE IF NOT EXISTS public.cm_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.cm_projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  source      text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'link')),
  file_path   text,            -- storage object path when source = 'upload'
  link_url    text,            -- external URL when source = 'link'
  file_type   text,            -- pdf / pptx / docx / xlsx / gdoc / gslides / …
  file_size   bigint,          -- bytes, for uploaded files
  uploaded_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cm_documents_source_target CHECK (
    (source = 'upload' AND file_path IS NOT NULL) OR
    (source = 'link'   AND link_url  IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_cm_documents_project ON public.cm_documents (project_id);

-- ---- 5. updated_at triggers -----------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cm_managers','cm_clients','cm_projects','cm_documents'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ---- 6. Flattened search view ---------------------------------------------
-- security_invoker = true → the querying user's RLS on the base tables applies,
-- so the view leaks nothing beyond what the user could already read directly.
DROP VIEW IF EXISTS public.v_cm_documents;
CREATE VIEW public.v_cm_documents
  WITH (security_invoker = true) AS
SELECT
  d.id,
  d.title,
  d.source,
  d.file_path,
  d.link_url,
  d.file_type,
  d.file_size,
  d.uploaded_by,
  d.created_at,
  d.updated_at,
  p.id           AS project_id,
  p.name         AS project_name,
  c.id           AS client_id,
  c.name         AS client_name,
  m.id           AS manager_id,
  m.name         AS manager_name,
  m.email        AS manager_email,
  m.mobile       AS manager_mobile
FROM public.cm_documents d
  JOIN public.cm_projects p ON p.id = d.project_id
  JOIN public.cm_clients  c ON c.id = p.client_id
  JOIN public.cm_managers m ON m.id = c.manager_id;

GRANT SELECT ON public.v_cm_documents TO authenticated;

-- ---- 7. RLS on the four tables --------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cm_managers','cm_clients','cm_projects','cm_documents'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (public.can_read_app(''pipeline-pro''))',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_write_app(''pipeline-pro''))',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated USING (public.can_write_app(''pipeline-pro'')) WITH CHECK (public.can_write_app(''pipeline-pro''))',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated USING (public.can_admin_app(''pipeline-pro''))',
      t, t);
  END LOOP;
END $$;

-- ---- 8. Private storage bucket for uploaded files -------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies, scoped to this bucket and the pipeline-pro matrix.
DROP POLICY IF EXISTS "client-documents read"   ON storage.objects;
DROP POLICY IF EXISTS "client-documents insert" ON storage.objects;
DROP POLICY IF EXISTS "client-documents update" ON storage.objects;
DROP POLICY IF EXISTS "client-documents delete" ON storage.objects;

CREATE POLICY "client-documents read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND public.can_read_app('pipeline-pro'));

CREATE POLICY "client-documents insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents' AND public.can_write_app('pipeline-pro'));

CREATE POLICY "client-documents update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'client-documents' AND public.can_write_app('pipeline-pro'))
  WITH CHECK (bucket_id = 'client-documents' AND public.can_write_app('pipeline-pro'));

CREATE POLICY "client-documents delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents' AND public.can_admin_app('pipeline-pro'));

COMMIT;

-- =============================================================================
-- Sanity checks (run after COMMIT):
--   \dt public.cm_*                         -- 4 tables present
--   SELECT * FROM public.v_cm_documents;    -- empty, no error
--   SELECT id, public FROM storage.buckets WHERE id = 'client-documents';
--
-- pipeline-pro is already registered in the access matrix, so every active
-- employee who can already use Pipeline Pro can read the library; write/admin
-- follow their existing pipeline-pro access level. No backfill required.
-- =============================================================================
