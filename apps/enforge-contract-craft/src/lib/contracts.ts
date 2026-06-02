import { supabase } from "@/lib/supabase";
import type { ContractView } from "@/lib/types";

function isPermissionError(error: unknown) {
  const err = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    details?: string;
    code?: string;
  };

  const status = err?.status ?? err?.statusCode;
  const message = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.code ?? ""}`.toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes("permission denied") ||
    message.includes("forbidden") ||
    message.includes("not authorized") ||
    message.includes("not allowed")
  );
}

async function fetchContractsFromBase(contractId?: string) {
  let query = supabase
    .from("contracts")
    .select(
      "id, title, type, status, value, currency, start_date, end_date, auto_renew, renewal_date, account_id, deal_id, owner_id, scope_summary, deliverables, payment_terms, client_signer_name, client_signer_email, enfactum_signer_id, internal_notes, file_url, signed_file_url, signed_at, created_at, metadata"
    )
    .not("status", "in", "(deleted,template)")
    .order("created_at", { ascending: false });

  if (contractId) {
    query = query.eq("id", contractId);
  }

  const { data: contracts, error } = await query;
  if (error) throw error;

  const rows = (contracts ?? []) as Array<Record<string, any>>;
  const accountIds = [...new Set(rows.map((row) => row.account_id).filter(Boolean))];
  const dealIds = [...new Set(rows.map((row) => row.deal_id).filter(Boolean))];
  const ownerIds = [...new Set(rows.map((row) => row.owner_id).filter(Boolean))];

  const [accountsResult, dealsResult, employeesResult] = await Promise.all([
    accountIds.length
      ? supabase.from("accounts").select("id, name").in("id", accountIds)
      : Promise.resolve({ data: [], error: null }),
    dealIds.length
      ? supabase.from("deals").select("id, title").in("id", dealIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase.from("employees").select("id, name").in("id", ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (accountsResult.error) throw accountsResult.error;
  if (dealsResult.error) throw dealsResult.error;
  if (employeesResult.error) throw employeesResult.error;

  const accountMap = new Map((accountsResult.data ?? []).map((account) => [account.id, account.name]));
  const dealMap = new Map((dealsResult.data ?? []).map((deal) => [deal.id, deal.title]));
  const employeeMap = new Map((employeesResult.data ?? []).map((employee) => [employee.id, employee.name]));

  return rows.map(
    (row) =>
      ({
        ...row,
        account_name: row.account_id ? accountMap.get(row.account_id) ?? null : null,
        deal_title: row.deal_id ? dealMap.get(row.deal_id) ?? null : null,
        owner_name: row.owner_id ? employeeMap.get(row.owner_id) ?? null : null,
      }) as ContractView
  );
}

export async function fetchContractsList() {
  try {
    const { data, error } = await supabase
      .from("v_contracts" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (isPermissionError(error)) {
        return await fetchContractsFromBase();
      }
      throw error;
    }

    return (data ?? []) as unknown as ContractView[];
  } catch (error) {
    if (isPermissionError(error)) {
      return await fetchContractsFromBase();
    }
    throw error;
  }
}

export async function fetchContractById(id: string) {
  try {
    const { data, error } = await supabase
      .from("v_contracts" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isPermissionError(error)) {
        const fallback = await fetchContractsFromBase(id);
        return fallback[0] ?? null;
      }
      throw error;
    }

    return (data ?? null) as ContractView | null;
  } catch (error) {
    if (isPermissionError(error)) {
      const fallback = await fetchContractsFromBase(id);
      return fallback[0] ?? null;
    }
    throw error;
  }
}
