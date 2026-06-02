import { createContext, useContext, useState, ReactNode } from "react";

interface FxRateContextValue {
  usdToSgd: number;
  setUsdToSgd: (rate: number) => void;
  lastUpdated: string | null;
  setLastUpdated: (date: string) => void;
}

const FxRateContext = createContext<FxRateContextValue>({
  usdToSgd: 1.30,
  setUsdToSgd: () => {},
  lastUpdated: null,
  setLastUpdated: () => {},
});

export function FxRateProvider({ children }: { children: ReactNode }) {
  const [usdToSgd, setUsdToSgdRaw] = useState<number>(1.30);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  function setUsdToSgd(rate: number) {
    setUsdToSgdRaw(rate);
  }

  return (
    <FxRateContext.Provider value={{ usdToSgd, setUsdToSgd, lastUpdated, setLastUpdated }}>
      {children}
    </FxRateContext.Provider>
  );
}

export function useFxRate() {
  return useContext(FxRateContext);
}
