import { createContext, useContext, useState, ReactNode } from "react";

export interface ChaseRecord {
  invoiceId: number;
  chasedOn: string;       // ISO date string e.g. "2026-02-19"
  followUpDays: number;   // days until next follow-up
  note: string;
}

interface ChaseContextValue {
  chaseRecords: Record<number, ChaseRecord>;
  addChase: (record: ChaseRecord) => void;
  clearChase: (invoiceId: number) => void;
}

const ChaseContext = createContext<ChaseContextValue>({
  chaseRecords: {},
  addChase: () => {},
  clearChase: () => {},
});

export function ChaseProvider({ children }: { children: ReactNode }) {
  const [chaseRecords, setChaseRecords] = useState<Record<number, ChaseRecord>>({});

  function addChase(record: ChaseRecord) {
    setChaseRecords(prev => ({ ...prev, [record.invoiceId]: record }));
  }

  function clearChase(invoiceId: number) {
    setChaseRecords(prev => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
  }

  return (
    <ChaseContext.Provider value={{ chaseRecords, addChase, clearChase }}>
      {children}
    </ChaseContext.Provider>
  );
}

export function useChase() {
  return useContext(ChaseContext);
}
