// Re-export supabase client with a loosely-typed helper for tables not yet in generated types
import { supabase } from '@/integrations/supabase/client';

// Use this for tables that exist in Supabase but aren't in the auto-generated types yet
export const db = supabase as any;

export { supabase };
