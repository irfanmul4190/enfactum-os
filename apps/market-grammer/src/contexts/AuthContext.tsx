// Thin wrapper around @enfactum/auth-gate. All gate logic + react context
// live in the shared package. Each app only declares its identity here.
import { createAuthGate } from "@enfactum/auth-gate";
import { supabase } from "@/integrations/supabase/client";

const gate = createAuthGate({
  supabase,
  appId: "market-grammer",
  appBasePath: "/market-grammer/",
  appLabel: "Market-Grammer",
});

export const AuthProvider = gate.AuthProvider;
export const useAuth = gate.useAuth;
export type { AccessLevel, AuthEmployee as Employee } from "@enfactum/auth-gate";
