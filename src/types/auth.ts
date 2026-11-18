import type { User, Session, AuthError } from '@supabase/supabase-js';

export type OAuthProvider = 'google' | 'apple';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}
