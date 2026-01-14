import { createBrowserClient } from '@supabase/ssr';
import { loadEnv } from '@shared/config/env';
import type { SupabaseClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = loadEnv();

// Lazy initialization to avoid creating Supabase client during SSR/SSG
let supabaseInstance: SupabaseClient | null = null;

// Use SSR-compatible browser client that syncs auth state with cookies
// This allows middleware to access auth state server-side
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
}

// Backward compatibility: export a getter that looks like a direct import
// This maintains compatibility with existing `import { supabase }` usage
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
