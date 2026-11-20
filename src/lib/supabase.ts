import { createClient } from '@supabase/supabase-js';

const globalProcess = (globalThis as any).process;
const env =
  typeof import.meta !== 'undefined' && import.meta && import.meta.env
    ? import.meta.env
    : (globalProcess && globalProcess.env ? globalProcess.env : {}) as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key-here' &&
  supabaseUrl.startsWith('https://')
);

// Fallback dummy for development initialization if env is not yet populated
const activeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const activeKey = isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'hauntly-auth-token',
  },
});

/**
 * Returns the dynamic redirect URL for OAuth providers (Google, Apple)
 * matching the user's current origin (e.g. http://localhost:5173/auth/callback)
 */
export const getAuthRedirectUrl = (): string => {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:5173';
  return `${origin}/auth/callback`;
};
