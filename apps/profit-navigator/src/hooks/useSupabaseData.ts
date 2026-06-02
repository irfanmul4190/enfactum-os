import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types matching Supabase tables
export interface DbDeal {
  id: string;
  account_id: string;
  owner_id: string;
  title: string;
  value: number;
  stage: string;
  win_probability: number;
}

export interface DbAccount {
  id: string;
  name: string;
  country: string | null;
  industry: string | null;
  tier: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  default_payment_terms_days: number | null;
  billing_currency: string | null;
  active: boolean | null;
  legal_name: string | null;
  tax_treatment: string | null;
  notes: string | null;
}

// public.project_details — 1:1 companion to deals (see migration
// 20260522140000). Holds the Profit Navigator-specific project fields.
export interface DbProjectDetails {
  deal_id: string;
  country_of_delivery: string | null;
  start_date: string | null;
  end_date: string | null;
  business_type: string | null;
  commercial_model: string | null;
  invoice_model: string | null;
  revenue_recognition_basis: string | null;
  margin_target_percent: number | null;
  approvals_status: string | null;
  sales_person: string | null;
  external_partner_stakeholder_id: string | null;
  partner_revenue_basis_ex_tax: number | null;
  flat_fee_percent: number | null;
  pass_through_payout_basis: string | null;
  internal_recharge_applies: boolean | null;
}

export interface DbMargin {
  id: string;
  deal_id: string;
  revenue: number;
  cost_of_goods: number;
  cost_of_services: number;
  mdf_subsidy: number;
  gross_profit: number;
  gp_percent: number;
  pricing_notes: string | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

export interface DbEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  auth_user_id: string | null;
}

export interface DbVDeal {
  id: string;
  title: string;
  description: string | null;
  currency: string | null;
  value: number;
  stage: string;
  win_probability: number;
  account_id: string;
  account_name: string;
  account_industry: string;
  account_tier: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  // Margin fields from the view (if joined)
  margin_id?: string;
  revenue?: number;
  cost_of_goods?: number;
  cost_of_services?: number;
  mdf_subsidy?: number;
  gross_profit?: number;
  gp_percent?: number;
  pricing_notes?: string;
  approved?: boolean;
}

// Generic fetch hook
function useSupabaseQuery<T>(
  tableName: string,
  selectQuery: string = "*",
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from(tableName)
      .select(selectQuery);

    if (err) {
      if (import.meta.env.DEV) console.error(`Error fetching ${tableName}:`, err);
      setError(err.message);
      setData([]);
    } else {
      setData((rows as T[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [tableName, selectQuery, ...deps]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useDeals() {
  return useSupabaseQuery<DbDeal>("deals");
}

export function useAccounts() {
  return useSupabaseQuery<DbAccount>("accounts");
}

export function useMargins() {
  const result = useSupabaseQuery<DbMargin>("margins");

  const upsertMargin = useCallback(async (margin: Omit<DbMargin, "gross_profit" | "gp_percent">) => {
    const { data, error } = await supabase
      .from("margins")
      .upsert(margin, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error upserting margin:", error);
      throw error;
    }
    result.refetch();
    return data;
  }, [result.refetch]);

  const insertMargin = useCallback(async (margin: Omit<DbMargin, "id" | "gross_profit" | "gp_percent">) => {
    const { data, error } = await supabase
      .from("margins")
      .insert(margin)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error inserting margin:", error);
      throw error;
    }
    result.refetch();
    return data;
  }, [result.refetch]);

  const updateMargin = useCallback(async (id: string, updates: Partial<DbMargin>) => {
    const { data, error } = await supabase
      .from("margins")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error("Error updating margin:", error);
      throw error;
    }
    result.refetch();
    return data;
  }, [result.refetch]);

  const deleteMargin = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("margins")
      .delete()
      .eq("id", id);

    if (error) {
      if (import.meta.env.DEV) console.error("Error deleting margin:", error);
      throw error;
    }
    result.refetch();
  }, [result.refetch]);

  return { ...result, upsertMargin, insertMargin, updateMargin, deleteMargin };
}

export function useEmployees() {
  return useSupabaseQuery<DbEmployee>("employees");
}

export function useVDeals() {
  return useSupabaseQuery<DbVDeal>("v_deals");
}

export function useProjectDetails() {
  return useSupabaseQuery<DbProjectDetails>("project_details");
}
