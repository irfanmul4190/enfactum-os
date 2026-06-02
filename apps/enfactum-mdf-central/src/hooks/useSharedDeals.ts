// Placeholder for the cross-app shared-deals pipeline.
//
// Originally this hook hit a `shared-query` Edge Function that queries
// pipeline-pro's deals/accounts tables across Supabase projects. That
// function never shipped, and the env var it depended on
// (VITE_SUPABASE_PROJECT_ID) isn't wired up in the monorepo Dockerfile.
//
// Until the cross-app data path is built, the hooks return empty arrays
// so the UI degrades to an empty state instead of an error toast.

import { useQuery } from "@tanstack/react-query";

export interface SharedDeal {
  id: string;
  title: string;
  value: number;
  mdf_eligible: boolean;
  mdf_amount: number | null;
  product_lines: string[] | null;
  account_id: string | null;
  stage: string | null;
}

export interface SharedAccount {
  id: string;
  name: string;
  vendor_flags: Record<string, boolean> | null;
}

export function useMDFDeals() {
  return useQuery({
    queryKey: ['shared-mdf-deals'],
    queryFn: async (): Promise<SharedDeal[]> => [],
    staleTime: Infinity,
  });
}

export function useSharedAccounts() {
  return useQuery({
    queryKey: ['shared-accounts'],
    queryFn: async (): Promise<SharedAccount[]> => [],
    staleTime: Infinity,
  });
}

export function useSharedEmployee(email: string | undefined) {
  return useQuery({
    queryKey: ['shared-employee', email],
    queryFn: async () => null,
    enabled: !!email,
    staleTime: Infinity,
  });
}
