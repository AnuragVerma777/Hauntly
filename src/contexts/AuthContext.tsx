import React, { useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getAuthRedirectUrl } from '../lib/supabase';
import type { OAuthProvider } from '../types/auth';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.warn('Hauntly Auth: Error retrieving session', error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Listen to continuous auth state changes (sign in, sign out, token refresh, OAuth return)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
          status: 400,
        } as AuthError,
      };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }> => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
          status: 400,
        } as AuthError,
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
          avatar_seed: Math.floor(Math.random() * 1000),
        },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });
    return { data, error };
  };

  const signInWithOAuth = async (provider: OAuthProvider): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error: {
          name: 'ConfigurationError',
          message: 'Supabase credentials are not configured. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
          status: 400,
        } as AuthError,
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectUrl(),
        queryParams:
          provider === 'google'
            ? {
                access_type: 'offline',
                prompt: 'consent',
              }
            : undefined,
      },
    });

    return { error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
