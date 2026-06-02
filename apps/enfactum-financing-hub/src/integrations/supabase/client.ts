import { createClient } from "@supabase/supabase-js";

// Reads from the shared monorepo env vars baked into the build by the root
// Dockerfile. Anon key is public by design (RLS enforces access).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
