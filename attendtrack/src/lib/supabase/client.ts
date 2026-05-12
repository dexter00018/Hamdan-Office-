const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
        signOut: async () => ({ error: { message: 'Supabase is not configured.' } }),
        getUser: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
      },
      from: () => ({
        select: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
        upsert: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
      }),
    };
  }

  const authUrl = `${supabaseUrl}/auth/v1`;
  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async (opts: any) => ({ data: null, error: { message: 'Sign up not implemented in stub' } }),
      signInWithPassword: async (opts: any) => ({ data: null, error: { message: 'Sign in not implemented in stub' } }),
      signOut: async () => ({ data: null, error: { message: 'Sign out not implemented in stub' } }),
      getUser: async () => ({ data: null, error: { message: 'Get user not implemented in stub' } }),
    },
    from: (table: string) => ({
      select: async (columns = '*') => {
        const params = new URLSearchParams({ select: columns });
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
          headers,
        });
        const data = await response.json();
        return { data, error: response.ok ? null : { message: data?.message || response.statusText } };
      },
      upsert: async (row: any) => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
          method: 'POST',
          headers: {
            ...headers,
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(row),
        });
        const data = response.status === 204 ? [] : await response.json();
        return { data, error: response.ok ? null : { message: data?.message || response.statusText } };
      },
    }),
  };
}
