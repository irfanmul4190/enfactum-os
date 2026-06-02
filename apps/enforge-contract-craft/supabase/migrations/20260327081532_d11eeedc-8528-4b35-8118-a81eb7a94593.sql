CREATE TABLE public.user_settings (
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

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());