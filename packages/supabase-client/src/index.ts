import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for a given app.
 * Each app passes its own VITE_ env vars so the factory stays framework-agnostic.
 */
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey);
}

/**
 * Checks whether the authenticated user's email belongs to the Enfactum domain.
 * Pass this to Supabase RLS or call it client-side after sign-in.
 */
export function isEnfactumEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith("@enfactum.com"));
}
