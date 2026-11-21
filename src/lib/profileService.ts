import { supabase, isSupabaseConfigured } from './supabase';
import type { Profile } from '../types/profile';
import type { User } from '@supabase/supabase-js';

const HAUNTLY_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOCAL_PROFILES_KEY = 'hauntly_local_profiles';

export const DEFAULT_SOUL_PROFILES: Record<string, Profile> = {
  usr_jack: {
    id: 'usr_jack',
    hauntly_id: 'HAUNT-8X29K',
    username: 'jack_lantern',
    display_name: 'Pumpkin King',
    avatar_url: '/avatars/avatar_pumpkin_face.jpg',
    avatar_selection: 'pumpkin_face',
    bio: 'Grinning through All Hallows Eve in the pumpkin patch.',
    location_name: 'Salem, Massachusetts',
    latitude: 42.5211,
    longitude: -70.8985,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  usr_vlad: {
    id: 'usr_vlad',
    hauntly_id: 'HAUNT-VAMP7',
    username: 'dracula',
    display_name: 'Count Vlad',
    avatar_url: '/avatars/avatar_vampire.jpg',
    avatar_selection: 'vampire',
    bio: 'Lord of the crimson crypt and midnight revels.',
    location_name: 'Transylvania, Romania',
    latitude: 45.5152,
    longitude: 25.3672,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  usr_luna: {
    id: 'usr_luna',
    hauntly_id: 'HAUNT-WTCH5',
    username: 'luna_witch',
    display_name: 'Luna Starlight',
    avatar_url: '/avatars/avatar_anime_witch.jpg',
    avatar_selection: 'anime_witch',
    bio: 'Brewing potions and starlight incantations for the coven.',
    location_name: 'Black Forest, Germany',
    latitude: 48.15,
    longitude: 8.2,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  usr_frank: {
    id: 'usr_frank',
    hauntly_id: 'HAUNT-FRNK2',
    username: 'frank_stein',
    display_name: 'Frankie',
    avatar_url: '/avatars/avatar_frankenstein.jpg',
    avatar_selection: 'frankenstein',
    bio: 'Reanimated with lightning and ready to party.',
    location_name: 'Geneva, Switzerland',
    latitude: 46.2044,
    longitude: 6.1432,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
  usr_casper: {
    id: 'usr_casper',
    hauntly_id: 'HAUNT-GHST1',
    username: 'casper_ghost',
    display_name: 'Ghosty Beats',
    avatar_url: '/avatars/avatar_ghost_headphones.jpg',
    avatar_selection: 'ghost_headphones',
    bio: 'Grooving to ethereal beats beyond the veil.',
    location_name: 'Edinburgh, Scotland',
    latitude: 55.9533,
    longitude: -3.1883,
    created_at: '2026-10-31T00:00:00.000Z',
    updated_at: '2026-10-31T00:00:00.000Z',
  },
};

const memoryProfiles: Record<string, Profile> = { ...DEFAULT_SOUL_PROFILES };

function getLocalProfiles(): Record<string, Profile> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      return { ...DEFAULT_SOUL_PROFILES, ...existing };
    }
  } catch {
    // ignore
  }
  return memoryProfiles;
}

function saveLocalProfiles(profiles: Record<string, Profile>) {
  try {
    Object.assign(memoryProfiles, profiles);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
    }
    // Dispatch custom event so other tabs sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }
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
      .select('id, hauntly_id, username, display_name, avatar_url, bio, location_name, latitude, longitude, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Fallback query if columns don't exist in remote table
      const fallback = await supabase
        .from('profiles')
        .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      if (fallback.data) {
        return { data: fallback.data, error: null };
      }
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
      '/avatars/avatar_vampire.jpg';

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
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
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
    if (updates.location_name !== undefined) {
      cleanUpdates.location_name = updates.location_name ? updates.location_name.trim() : null;
    }
    if (updates.latitude !== undefined) {
      cleanUpdates.latitude = typeof updates.latitude === 'number' ? updates.latitude : null;
    }
    if (updates.longitude !== undefined) {
      cleanUpdates.longitude = typeof updates.longitude === 'number' ? updates.longitude : null;
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
      .select('id, hauntly_id, username, display_name, avatar_url, bio, location_name, latitude, longitude, created_at, updated_at')
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
 * Creates a portable web invite URL encoding the user's public moniker and ID.
 * This guarantees that clicking the invite link on ANY device or browser across the
 * internet immediately resolves the friend's profile even before Supabase is connected!
 */
export function createInviteUrl(profile: Profile): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://hauntly-eight.vercel.app';
  try {
    const payload = {
      id: profile.id,
      hid: profile.hauntly_id,
      u: profile.username,
      dn: profile.display_name,
      av: profile.avatar_url,
    };
    const token = btoa(encodeURIComponent(JSON.stringify(payload)));
    return `${origin}/profile?invite=${token}&addFriend=${encodeURIComponent(profile.hauntly_id)}`;
  } catch {
    return `${origin}/profile?addFriend=${encodeURIComponent(profile.hauntly_id)}`;
  }
}

/**
 * Parses a portable invite token from URL parameters.
 */
export function parseInviteToken(token: string): Profile | null {
  try {
    const raw = decodeURIComponent(atob(token));
    const p = JSON.parse(raw);
    if (!p.hid) return null;
    const suffix = p.hid.replace(/^HAUNT-/i, '').toLowerCase();
    const resolved: Profile = {
      id: p.id || `usr_${suffix}`,
      hauntly_id: p.hid.toUpperCase().startsWith('HAUNT-') ? p.hid.toUpperCase() : `HAUNT-${p.hid.toUpperCase()}`,
      username: p.u || `spirit_${suffix}`,
      display_name: p.dn || p.u || `Companion #${suffix}`,
      avatar_url: p.av || '/avatars/avatar_vampire.jpg',
      bio: 'Invited companion across the ethereal web.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    registerExternalProfile(resolved);
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Registers an external or newly encountered companion profile into local cache.
 */
export function registerExternalProfile(profile: Profile): void {
  try {
    const profiles = getLocalProfiles();
    profiles[profile.id] = { ...profiles[profile.id], ...profile };
    saveLocalProfiles(profiles);
  } catch (err) {
    console.warn('Failed to register external profile', err);
  }
}

/**
 * Creates a valid companion profile from a Hauntly ID pattern.
 * Enables instant summoning of any friend ID entered manually on separate devices.
 */
export function createCompanionFromId(rawId: string): Profile {
  const clean = rawId.trim().replace(/^[#@]/, '').toUpperCase();
  const hauntId = clean.startsWith('HAUNT-') ? clean : `HAUNT-${clean}`;
  const suffix = hauntId.replace('HAUNT-', '').toLowerCase();
  const id = `usr_${suffix}`;

  const companion: Profile = {
    id,
    hauntly_id: hauntId,
    username: `spirit_${suffix}`,
    display_name: `Companion #${suffix}`,
    avatar_url: '/avatars/avatar_pumpkin_face.jpg',
    bio: 'Summoned spirit companion across the veil.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  registerExternalProfile(companion);
  return companion;
}

/**
 * Search user profile by Hauntly ID (e.g. HAUNT-8X29K, #8X29K, 8X29K),
 * User ID (UUID), or username/display name across the internet.
 * Strict projection to guarantee NO EMAIL is ever exposed.
 */
export async function searchByHauntlyId(
  hauntlyId: string
): Promise<{ data: Profile | null; error: Error | null }> {
  const raw = hauntlyId.trim();
  if (!raw) {
    return { data: null, error: null };
  }

  // Strip leading hashtag, @-symbol, and extra spaces
  const clean = raw.replace(/^[#@]/, '').trim();
  const upper = clean.toUpperCase();
  const candidateHauntId = upper.startsWith('HAUNT-') ? upper : `HAUNT-${upper}`;
  const cleanHandle = clean.toLowerCase();

  // 1. Check local profiles (seeded + cached + previously encountered)
  const localProfiles = getLocalProfiles();
  const localList = Object.values(localProfiles);
  const localFound = localList.find((p) => {
    const pHaunt = p.hauntly_id.toUpperCase();
    const pCore = pHaunt.replace('HAUNT-', '');
    const pId = p.id.toLowerCase();
    const pUser = (p.username || '').toLowerCase();
    const pName = (p.display_name || '').toLowerCase();

    return (
      pHaunt === upper ||
      pHaunt === candidateHauntId ||
      pCore === upper ||
      pCore === clean.toUpperCase() ||
      pId === clean.toLowerCase() ||
      pUser === cleanHandle ||
      pName === cleanHandle
    );
  });

  const isHauntlyFormat =
    (candidateHauntId.startsWith('HAUNT-') && candidateHauntId.length >= 8 && /^[A-Z0-9-]+$/i.test(candidateHauntId)) ||
    (upper.length >= 4 && upper.length <= 10 && /^[A-Z0-9]+$/i.test(upper));

  if (!isSupabaseConfigured) {
    if (localFound) {
      return { data: localFound, error: null };
    }
    // If running in local mode and user types a valid Hauntly ID from another device (e.g. HAUNT-4MW5L):
    // Automatically summon the companion so the user is never blocked!
    if (isHauntlyFormat) {
      const companion = createCompanionFromId(clean);
      return { data: companion, error: null };
    }
    return { data: null, error: null };
  }

  // 2. Query Supabase
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    let orClause = `hauntly_id.ilike.${candidateHauntId},hauntly_id.ilike.${upper},username.ilike.${cleanHandle}`;
    if (isUuid) {
      orClause += `,id.eq.${clean}`;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at')
      .or(orClause)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return { data, error: null };
    }

    // Secondary fallback: partial match on hauntly_id or username or display_name
    const { data: partialData } = await supabase
      .from('profiles')
      .select('id, hauntly_id, username, display_name, avatar_url, bio, created_at')
      .or(`hauntly_id.ilike.%${clean}%,username.ilike.%${cleanHandle}%,display_name.ilike.%${clean}%`)
      .limit(1)
      .maybeSingle();

    if (partialData) {
      return { data: partialData, error: null };
    }

    // If not found in remote Supabase, fall back to local/seed companions (e.g. Vlad, Jack)
    if (localFound) {
      return { data: localFound, error: null };
    }

    // If valid Hauntly ID pattern, create guest companion so connection is never blocked
    if (isHauntlyFormat) {
      const companion = createCompanionFromId(clean);
      return { data: companion, error: null };
    }

    return { data: null, error: null };
  } catch (err: unknown) {
    // If Supabase throws network error, check localFound or create companion
    if (localFound) {
      return { data: localFound, error: null };
    }
    if (isHauntlyFormat) {
      const companion = createCompanionFromId(clean);
      return { data: companion, error: null };
    }
    return { data: null, error: err instanceof Error ? err : new Error('Search failed') };
  }
}
