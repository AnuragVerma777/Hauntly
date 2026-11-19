import React, { useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getAuthRedirectUrl } from '../lib/supabase';
import type { OAuthProvider } from '../types/auth';
import { AuthContext } from './authContextDef';
import { ensureProfile } from '../lib/profileService';

const LOCAL_USER_KEY = 'hauntly_active_user';
const LOCAL_SESSION_KEY = 'hauntly_active_session';

function createMockSession(user: User): Session {
  return {
    access_token: 'mock-token-' + user.id,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-' + user.id,
    user,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [session, setSession] = useState<Session | null>(() => {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem(LOCAL_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // 1. Supabase configured: check remote active session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.warn('Hauntly Auth: Error retrieving session', error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Listen to continuous auth state changes
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
      const cleanEmail = email.trim().toLowerCase();
      const userId = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const mockUser: User = {
        id: userId,
        app_metadata: { provider: 'email' },
        user_metadata: {
          display_name: cleanEmail.split('@')[0],
          avatar_url: '/avatar_witch_pumpkin.png',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      const mockSession = createMockSession(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockSession));
      setUser(mockUser);
      setSession(mockSession);
      await ensureProfile(mockUser);
      return { error: null };
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
      const cleanEmail = email.trim().toLowerCase();
      const userId = 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const mockUser: User = {
        id: userId,
        app_metadata: { provider: 'email' },
        user_metadata: {
          display_name: displayName || cleanEmail.split('@')[0],
          avatar_url: '/avatar_witch_pumpkin.png',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      const mockSession = createMockSession(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockSession));
      setUser(mockUser);
      setSession(mockSession);
      await ensureProfile(mockUser);
      return { data: { user: mockUser, session: mockSession }, error: null };
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
      const userId = 'usr_oauth_' + provider;
      const mockUser: User = {
        id: userId,
        app_metadata: { provider },
        user_metadata: {
          display_name: provider === 'google' ? 'Spectral Wanderer' : 'Apparition Lord',
          avatar_url: '/avatar_cute_ghost.png',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: `${provider}_soul@hauntly.realm`,
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      const mockSession = createMockSession(mockUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(mockSession));
      setUser(mockUser);
      setSession(mockSession);
      await ensureProfile(mockUser);
      return { error: null };
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
    if (!isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setSession(null);
      return { error: null };
    }
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
