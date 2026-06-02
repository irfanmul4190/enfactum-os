import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AccountRow {
  id: string;
  name: string;
  default_payment_terms_days: number | null;
  billing_currency: string | null;
  active: boolean;
}

export interface AccountLeadRow {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
}

interface AccountsContextValue {
  accounts: AccountRow[];
  leads: AccountLeadRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue>({
  accounts: [],
  leads: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [leads, setLeads] = useState<AccountLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      const [accountsRes, leadsRes] = await Promise.all([
        supabase
          .from("accounts")
          .select("id, name, default_payment_terms_days, billing_currency, active")
          .order("name", { ascending: true }),
        supabase
          .from("account_leads")
          .select("id, name, email, active")
          .order("name", { ascending: true }),
      ]);
      if (accountsRes.error) throw accountsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      setAccounts((accountsRes.data ?? []) as AccountRow[]);
      setLeads((leadsRes.data ?? []) as AccountLeadRow[]);
    } catch (e: any) {
      if (import.meta.env.DEV) console.error("Failed to load accounts/leads:", e);
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <AccountsContext.Provider value={{ accounts, leads, loading, error, refresh }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  return useContext(AccountsContext);
}

// Convenience selector: just the active account names. Use when you only need
// the dropdown list and don't care about IDs or terms.
export function useActiveAccountNames(): string[] {
  const { accounts } = useAccounts();
  return accounts.filter((a) => a.active).map((a) => a.name);
}

// Convenience selector: just the active lead names.
export function useActiveLeadNames(): string[] {
  const { leads } = useAccounts();
  return leads.filter((l) => l.active).map((l) => l.name);
}
