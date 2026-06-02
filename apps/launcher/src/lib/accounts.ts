import { getSupabaseClient } from "./auth";

export interface AccountRow {
  id: string;
  name: string;
  default_payment_terms_days: number | null;
  billing_currency: string | null;
  active: boolean;
  created_at?: string | null;
}

export interface AccountLeadRow {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
  created_at?: string | null;
}

export interface AccountInput {
  name: string;
  default_payment_terms_days?: number;
  billing_currency?: string;
  active?: boolean;
}

export interface AccountLeadInput {
  name: string;
  email?: string | null;
  active?: boolean;
}

// ─── accounts ─────────────────────────────────────────────────────────────

export async function listAccounts(): Promise<AccountRow[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, default_payment_terms_days, billing_currency, active, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AccountRow[];
}

export async function addAccount(input: AccountInput): Promise<AccountRow> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      name: input.name.trim(),
      default_payment_terms_days: input.default_payment_terms_days ?? 30,
      billing_currency: input.billing_currency ?? "SGD",
      active: input.active ?? true,
    })
    .select("id, name, default_payment_terms_days, billing_currency, active, created_at")
    .single();
  if (error) throw error;
  return data as AccountRow;
}

export async function updateAccount(
  id: string,
  patch: Partial<AccountInput>,
): Promise<AccountRow> {
  const supabase = await getSupabaseClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.default_payment_terms_days !== undefined) update.default_payment_terms_days = patch.default_payment_terms_days;
  if (patch.billing_currency !== undefined) update.billing_currency = patch.billing_currency;
  if (patch.active !== undefined) update.active = patch.active;
  const { data, error } = await supabase
    .from("accounts")
    .update(update)
    .eq("id", id)
    .select("id, name, default_payment_terms_days, billing_currency, active, created_at")
    .single();
  if (error) throw error;
  return data as AccountRow;
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

// ─── account_leads ────────────────────────────────────────────────────────

export async function listLeads(): Promise<AccountLeadRow[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("account_leads")
    .select("id, name, email, active, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AccountLeadRow[];
}

export async function addLead(input: AccountLeadInput): Promise<AccountLeadRow> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("account_leads")
    .insert({
      name: input.name.trim(),
      email: input.email?.trim() || null,
      active: input.active ?? true,
    })
    .select("id, name, email, active, created_at")
    .single();
  if (error) throw error;
  return data as AccountLeadRow;
}

export async function updateLead(
  id: string,
  patch: Partial<AccountLeadInput>,
): Promise<AccountLeadRow> {
  const supabase = await getSupabaseClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.email !== undefined) update.email = patch.email?.trim() || null;
  if (patch.active !== undefined) update.active = patch.active;
  const { data, error } = await supabase
    .from("account_leads")
    .update(update)
    .eq("id", id)
    .select("id, name, email, active, created_at")
    .single();
  if (error) throw error;
  return data as AccountLeadRow;
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("account_leads").delete().eq("id", id);
  if (error) throw error;
}
