import { createAuthGate } from "@enfactum/auth-gate";
import { supabase } from "@/integrations/supabase/client";

const gate = createAuthGate({
  supabase,
  appId: "enforge-contract-craft",
  appBasePath: "/enforge-contract-craft/",
  appLabel: "Enforge Contract Craft",
});

export const AuthProvider = gate.AuthProvider;

// Back-compat: original ECC code reads `isDemo` to gate against demo mode.
// The shared gate has no demo mode (real Google SSO only), so we expose
// `isDemo: false` here so unmodified pages keep working.
export function useAuth() {
  const ctx = gate.useAuth();
  return { ...ctx, isDemo: false };
}

export type { AccessLevel, AuthEmployee as Employee } from "@enfactum/auth-gate";
