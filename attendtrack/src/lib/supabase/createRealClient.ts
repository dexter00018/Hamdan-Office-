import { createClient as createSupabaseClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Small wrapper that ensures we only use the real supabase-js client
// when env vars are present.
export function createRealClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Keep default; consumers can override if needed.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export type { Session, User };

