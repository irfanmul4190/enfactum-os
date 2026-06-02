import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAccounts } from "@/hooks/useAccounts";

export type PaymentTerm = 0 | 7 | 10 | 15 | 30 | 45 | 60;

export type AccountTerms = Record<string, PaymentTerm>;

interface PaymentTermsContextValue {
  terms: AccountTerms;
  setTerm: (account: string, days: PaymentTerm) => void;
  resetTerms: () => void;
  getTermFor: (account: string) => PaymentTerm;
}

const PaymentTermsContext = createContext<PaymentTermsContextValue>({
  terms: {},
  setTerm: () => {},
  resetTerms: () => {},
  getTermFor: () => 30,
});

function snapToTerm(days: number | null | undefined): PaymentTerm {
  // Only the closed-set values from the dropdown are valid.
  const validValues: PaymentTerm[] = [0, 7, 10, 15, 30, 45, 60];
  if (days == null) return 30;
  let nearest: PaymentTerm = 30;
  let best = Infinity;
  for (const v of validValues) {
    const d = Math.abs(v - days);
    if (d < best) {
      best = d;
      nearest = v;
    }
  }
  return nearest;
}

export function PaymentTermsProvider({ children }: { children: ReactNode }) {
  const { accounts } = useAccounts();
  const [overrides, setOverrides] = useState<AccountTerms>({});

  // Defaults come from accounts.default_payment_terms_days. Overrides live in
  // session state (this provider) and "win" against defaults for the current
  // browser session. Persisting overrides would mean writing back to the
  // accounts table — wire that up when there's an admin UI for it.
  const defaults: AccountTerms = {};
  for (const a of accounts) {
    defaults[a.name] = snapToTerm(a.default_payment_terms_days);
  }
  const terms: AccountTerms = { ...defaults, ...overrides };

  function setTerm(account: string, days: PaymentTerm) {
    setOverrides((prev) => ({ ...prev, [account]: days }));
  }

  function resetTerms() {
    setOverrides({});
  }

  function getTermFor(account: string): PaymentTerm {
    return terms[account] ?? 30;
  }

  // If accounts list changes (e.g. someone added a new account in another
  // tab), prune any session overrides that no longer match a known account.
  useEffect(() => {
    setOverrides((prev) => {
      const known = new Set(accounts.map((a) => a.name));
      const next: AccountTerms = {};
      for (const [name, term] of Object.entries(prev)) {
        if (known.has(name)) next[name] = term;
      }
      return next;
    });
  }, [accounts]);

  return (
    <PaymentTermsContext.Provider value={{ terms, setTerm, resetTerms, getTermFor }}>
      {children}
    </PaymentTermsContext.Provider>
  );
}

export function usePaymentTerms() {
  return useContext(PaymentTermsContext);
}

export const TERM_OPTIONS: PaymentTerm[] = [0, 7, 10, 15, 30, 45, 60];
