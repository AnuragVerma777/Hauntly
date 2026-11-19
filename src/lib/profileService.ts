import { supabase, isSupabaseConfigured } from './supabase';
import type { Profile } from '../types/profile';
import type { User } from '@supabase/supabase-js';

const HAUNTLY_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOCAL_PROFILES_KEY = 'hauntly_local_profiles';

function getLocalProfiles(): Record<string, Profile> {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProfiles(profiles: Record<string, Profile>) {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
    // Dispatch custom event so other tabs sync
    window.dispatchEvent(new Event('hauntly_storage_update'));
  } catch (e) {
    console.warn('Failed to save local profiles', e);
  }
}

/**
 * Generate a Hauntly ID formatted as HAUNT-XXXXX
 */
export function generateClientHauntlyId(): string {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += HAUNTLY_CHARS.charAt(Math.floor(Math.random() * HAUNTLY_CHARS.length));
  }
  return `HAUNT-${suffix}`;
}

/**
 * Retrieves a user profile by user UID
 */
export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const found = profiles[userId] || null;
    return { data: found, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to retrieve profile') };
  }
}

/**
 * Guarantees a profile exists for an authenticated user.
 */
export async function ensureProfile(user: User): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const existing = await getProfile(user.id);
    if (existing.data) {
      return existing;
    }

    // Determine initial fields from auth metadata
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Phantom';

    const rawHandle = (user.user_metadata?.username || user.email?.split('@')[0] || 'phantom')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    const baseUsername = rawHandle.length >= 3 ? rawHandle : `${rawHandle}_spirit`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const initialUsername = `${baseUsername.slice(0, 20)}_${randomSuffix}`;

    const hauntlyId = generateClientHauntlyId();
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      '/avatar_witch_pumpkin.png';

    if (!isSupabaseConfigured) {
      const newProfile: Profile = {
        id: user.id,
        hauntly_id: hauntlyId,
        username: initialUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
        bio: 'Wandering the nocturnal corridors of Hauntly.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const profiles = getLocalProfiles();
      profiles[user.id] = newProfile;
      saveLocalProfiles(profiles);
      return { data: newProfile, error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        hauntly_id: hauntlyId,
        username: initialUsername,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at, updated_at')
      .single();

    if (error) {
      const retry = await getProfile(user.id);
      if (retry.data) return retry;
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to ensure profile') };
  }
}

/**
 * Update the user's profile (display_name, username, avatar_url, bio)
 */
export async function updateProfile(
  userId: string,
  updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string | null;
    bio?: string;
  }
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const cleanUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.display_name !== undefined) {
      cleanUpdates.display_name = updates.display_name.trim();
    }
    if (updates.avatar_url !== undefined) {
      cleanUpdates.avatar_url = updates.avatar_url;
    }
    if (updates.bio !== undefined) {
      cleanUpdates.bio = updates.bio.trim();
    }
    if (updates.username !== undefined) {
      const sanitizedUsername = updates.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
        return { data: null, error: new Error('Username must be between 3 and 30 characters') };
      }
      cleanUpdates.username = sanitizedUsername;
    }

    if (!isSupabaseConfigured) {
      const profiles = getLocalProfiles();
      const current = profiles[userId];
      if (!current) {
        return { data: null, error: new Error('Profile not found') };
      }
      const updated: Profile = {
        ...current,
        ...(cleanUpdates as any),
      };
      profiles[userId] = updated;
      saveLocalProfiles(profiles);
      return { data: updated, error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: new Error('This spirit moniker (@username) is already claimed in the realm.') };
      }
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to update profile') };
  }
}

/**
 * Search user profile by Hauntly ID (e.g. HAUNT-8X29K).
 * Strict projection to guarantee NO EMAIL is ever exposed.
 */
export async function searchByHauntlyId(
  hauntlyId: string
): Promise<{ data: Profile | null; error: Error | null }> {
  const cleanId = hauntlyId.trim().toUpperCase();
  if (!cleanId) {
    return { data: null, error: null };
  }

  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const found = Object.values(profiles).find(
      (p) => p.hauntly_id.toUpperCase() === cleanId || p.hauntly_id.toUpperCase().replace('HAUNT-', '') === cleanId.replace('HAUNT-', '')
    );
    return { data: found || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at')
      .ilike('hauntly_id', cleanId)
      .maybeSingle();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error('Search failed') };
  }
}
