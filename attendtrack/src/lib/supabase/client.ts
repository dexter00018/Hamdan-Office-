'use client';

import { createRealClient } from './createRealClient';

/**
 * Client wrapper used across the app.
 * 
 * - When SUPABASE env vars are missing/invalid, returns a minimal stub that still type-checks.
 * - When env vars exist, returns the real @supabase/supabase-js client.
 */

type Unsubscribe = { unsubscribe: () => void };

type AuthLike = {
  getSession: () => Promise<{ data: { session: any } }>;
  onAuthStateChange: (
    callback: (event: string, session: any) => void
  ) => { data: { subscription: Unsubscribe } };
  signUp: (args: any) => Promise<{ data: any; error: any }>;
  signInWithPassword: (args: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  getUser: () => Promise<{ data: { user: any }; error: any }>;
};

type QueryLike = {
  select: (columns?: string) => QueryLike;
  upsert: (row: any) => Promise<{ data: any; error: any }>;
  eq: (column: string, value: any) => QueryLike;
  single: () => Promise<{ data: any; error: any }>;
};

type SupabaseLike = {
  auth: AuthLike;
  from: (table: string) => QueryLike;
};

function makeStubClient(): SupabaseLike {
  const err = (message: string) => ({ message });

  const stubQuery: QueryLike = {
    select: () => stubQuery,
    upsert: async () => ({ data: null, error: err('Supabase is not configured.') }),
    eq: () => stubQuery,
    single: async () => ({ data: null, error: err('Supabase is not configured.') }),
  };

  const stubAuth: AuthLike = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (callback) => {
      // call once with null session
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signUp: async () => ({ data: null, error: err('Supabase is not configured.') }),
    signInWithPassword: async () => ({ data: null, error: err('Supabase is not configured.') }),
    signOut: async () => ({ error: err('Supabase is not configured.') }),
    getUser: async () => ({ data: { user: null }, error: err('Supabase is not configured.') }),
  };

  return {
    auth: stubAuth,
    from: () => stubQuery,
  };
}

export function createClient(): SupabaseLike {
  const real = createRealClient();
  if (!real) return makeStubClient();

  // The real client satisfies the same surface we use.
  return real as any;
}

