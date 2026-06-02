// Thin wrapper around @enfactum/auth-gate. All gate logic + react context
// live in the shared package. Names are preserved here (SupabaseAuthProvider /
// useSupabaseAuth / Employee) for backward compat — profit-navigator's
// `src/hooks/useAuth.tsx` wraps these into its richer role/permission layer.
import { createAuthGate, type AuthEmployee } from "@enfactum/auth-gate";
import { supabase } from "@/integrations/supabase/client";

const gate = createAuthGate({
  supabase,
  appId: "profit-navigator",
  appBasePath: "/profit-navigator/",
  appLabel: "Profit Navigator",
});

export const SupabaseAuthProvider = gate.AuthProvider;
export const useSupabaseAuth = gate.useAuth;

export type Employee = AuthEmployee;
export type { AccessLevel } from "@enfactum/auth-gate";
