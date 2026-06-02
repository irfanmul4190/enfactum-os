import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface FxRates {
  [pair: string]: number; // e.g. "USD_SGD": 1.35
}

interface CurrencyContextType {
  fxRates: FxRates;
  lastUpdated: Date | null;
  isLoading: boolean;
  setManualRate: (from: string, to: string, rate: number) => void;
  toSGD: (amount: number, currency: string) => number;
  fmtCurrencyWithPrefix: (amount: number, currency: string) => string;
  fmtSGD: (amount: number) => string;
  refreshRates: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  SGD: "SG$",
  USD: "US$",
  INR: "₹",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  THB: "฿",
  JPY: "¥",
  AUD: "A$",
};

const DEFAULT_RATES: FxRates = {
  USD_SGD: 1.35,
  INR_SGD: 0.016,
  MYR_SGD: 0.30,
  IDR_SGD: 0.000084,
  PHP_SGD: 0.024,
  VND_SGD: 0.000054,
  THB_SGD: 0.038,
  JPY_SGD: 0.009,
  AUD_SGD: 0.88,
  SGD_SGD: 1,
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [fxRates, setFxRates] = useState<FxRates>({ ...DEFAULT_RATES });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveRates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try fetching from a free public API
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/SGD");
      if (res.ok) {
        const data = await res.json();
        const newRates: FxRates = { SGD_SGD: 1 };
        Object.entries(data.rates as Record<string, number>).forEach(([cur, rate]) => {
          // We need cur -> SGD, API gives SGD -> cur, so invert
          if (rate > 0) {
            newRates[`${cur}_SGD`] = 1 / (rate as number);
          }
        });
        setFxRates(prev => ({ ...prev, ...newRates }));
        setLastUpdated(new Date());
      }
    } catch {
      // Keep default/manual rates
      if (!lastUpdated) setLastUpdated(new Date()); // Mark defaults as loaded
    } finally {
      setIsLoading(false);
    }
  }, [lastUpdated]);

  useEffect(() => {
    fetchLiveRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManualRate = useCallback((from: string, to: string, rate: number) => {
    setFxRates(prev => ({ ...prev, [`${from}_${to}`]: rate }));
    setLastUpdated(new Date());
  }, []);

  const toSGD = useCallback((amount: number, currency: string): number => {
    if (currency === "SGD") return amount;
    const rate = fxRates[`${currency}_SGD`];
    if (rate) return amount * rate;
    return amount; // Fallback: treat as SGD if no rate
  }, [fxRates]);

  const fmtCurrencyWithPrefix = useCallback((amount: number, currency: string): string => {
    const prefix = CURRENCY_SYMBOLS[currency] || `${currency} `;
    return `${prefix} ${new Intl.NumberFormat("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;
  }, []);

  const fmtSGD = useCallback((amount: number): string => {
    return `SG$ ${new Intl.NumberFormat("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}`;
  }, []);

  return (
    <CurrencyContext.Provider value={{ fxRates, lastUpdated, isLoading, setManualRate, toSGD, fmtCurrencyWithPrefix, fmtSGD, refreshRates: fetchLiveRates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export { CURRENCY_SYMBOLS };
