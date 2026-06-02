// Back-compat shim — the original Lovable codebase imported the supabase
// client from "@/lib/supabase". The canonical client now lives at
// "@/integrations/supabase/client" and reads env vars baked in by the root
// Dockerfile. Keep this re-export so unmodified imports keep working.
export { supabase } from "@/integrations/supabase/client";
export const isSupabaseConfigured = true;
