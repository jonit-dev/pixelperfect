import { createClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/config/env';

if (!clientEnv.SUPABASE_URL) {
  console.warn('Warning: SUPABASE_URL is not set.');
}

if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
}

// Service role key for admin operations (bypasses RLS)
// This should ONLY be used in secure server-side contexts (API routes, webhooks)
export const supabaseAdmin = createClient(clientEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
