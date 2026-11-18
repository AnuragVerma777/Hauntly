import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  return `${window.location.origin}/auth/callback`;
};
