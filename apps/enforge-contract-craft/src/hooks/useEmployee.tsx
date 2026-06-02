import { type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthEmployee } from "@enfactum/auth-gate";

export type Employee = AuthEmployee;

export function EmployeeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useEmployee() {
  const { employee, loading } = useAuth();
  return {
    employee,
    loading,
    refreshEmployee: async () => {},
  };
}
