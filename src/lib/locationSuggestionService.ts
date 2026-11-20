import { supabase, isSupabaseConfigured } from './supabase';
import type { GroupLocation, LocationVote } from '../types/globe';
import type { GroupMessage } from '../types/groupChat';
import { addGroupLocation } from './globeService';
import { sendGroupMessage } from './groupChatService';

// ─────────────────────────────────────────────────────────────────────────────
// Local storage keys for fallback & local testing
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_VOTES_KEY = 'hauntly_local_location_votes';
const LOCAL_LOCATIONS_KEY = 'hauntly_local_group_locations';

let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel('hauntly_realtime_group_chat');
  }
} catch {
  // BroadcastChannel unavailable
}

function getStored<T>(key: string): T[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function setStored<T>(key: string, data: T[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GEOCODING - Search for places using Nominatim + Gothic Fallback Hotspots
// ─────────────────────────────────────────────────────────────────────────────
export interface GeocodingResult {
  place_id: string;
  display_name: string;
  name: string;
  lat: number;
  lon: number;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  type: string;
}

const GOTHIC_HOTSPOTS: GeocodingResult[] = [
  {
    place_id: 'spot_bran',
    name: "Bran Castle (Dracula's Fortress)",
    display_name: 'Strada General Traian Moșoiu 24, Bran 507025, Romania',
    lat: 45.5152,
    lon: 25.3672,
    address: { road: 'Strada General Traian Moșoiu 24', city: 'Bran', country: 'Romania' },
    type: 'castle',
  },
  {
    place_id: 'spot_salem',
    name: 'Salem Witch House (Corwin Estate)',
    display_name: '310 Essex St, Salem, MA 01970, USA',
    lat: 42.5211,
    lon: -70.8985,
    address: { road: '310 Essex St', city: 'Salem', state: 'Massachusetts', country: 'USA' },
    type: 'historic',
  },
  {
    place_id: 'spot_paris',
    name: "Catacombs of Paris (L'Empire de la Mort)",
    display_name: '1 Avenue du Colonel Henri Rol-Tanguy, 75014 Paris, France',
    lat: 48.8338,
    lon: 2.3324,
    address: { road: '1 Avenue du Colonel Henri Rol-Tanguy', city: 'Paris', country: 'France' },
    type: 'crypt',
  },
  {
    place_id: 'spot_sedlec',
    name: 'Sedlec Ossuary (Church of Bones)',
    display_name: 'Zámecká, 284 03 Kutná Hora, Czech Republic',
    lat: 49.9618,
    lon: 15.2881,
    address: { road: 'Zámecká', city: 'Kutná Hora', country: 'Czech Republic' },
    type: 'sanctuary',
  },
  {
    place_id: 'spot_edinburgh',
    name: 'Edinburgh Castle & Greyfriars Kirkyard',
    display_name: 'Castlehill, Edinburgh EH1 2NG, Scotland, UK',
    lat: 55.9486,
    lon: -3.1999,
    address: { road: 'Castlehill', city: 'Edinburgh', country: 'United Kingdom' },
    type: 'historic',
  },
  {
    place_id: 'spot_bhangarh',
    name: 'Bhangarh Fort (Cursed Ruins of Rajasthan)',
    display_name: 'Gola ka baas, Rajgarh Tehsil, Alwar, Rajasthan 301410, India',
    lat: 27.0964,
    lon: 76.2862,
    address: { city: 'Alwar', state: 'Rajasthan', country: 'India' },
    type: 'fort',
  },
  {
    place_id: 'spot_aokigahara',
    name: 'Aokigahara (Sea of Trees)',
    display_name: 'Fujikawaguchiko, Minamitsuru District, Yamanashi 401-0300, Japan',
    lat: 35.4745,
    lon: 138.6496,
    address: { city: 'Fujikawaguchiko', state: 'Yamanashi', country: 'Japan' },
    type: 'observatory',
  },
  {
    place_id: 'spot_tower_london',
    name: 'Tower of London & Traitors Gate',
    display_name: 'Tower Hill, London EC3N 4AB, United Kingdom',
    lat: 51.5081,
    lon: -0.0759,
    address: { road: 'Tower Hill', city: 'London', country: 'United Kingdom' },
    type: 'historic',
  },
  {
    place_id: 'spot_winchester',
    name: 'Winchester Mystery House',
    display_name: '525 S Winchester Blvd, San Jose, CA 95128, USA',
    lat: 37.3184,
    lon: -121.9511,
    address: { road: '525 S Winchester Blvd', city: 'San Jose', state: 'California', country: 'USA' },
    type: 'mansion',
  },
  {
    place_id: 'spot_poveglia',
    name: 'Poveglia Island (The Plague Quarantine)',
    display_name: 'Venetian Lagoon, Venice 30100, Italy',
    lat: 45.3824,
    lon: 12.3315,
    address: { city: 'Venice', country: 'Italy' },
    type: 'island',
  },
];

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  // Match local hotspots first for instant suggestions
  const matchedHotspots = GOTHIC_HOTSPOTS.filter(
    (h) =>
      h.name.toLowerCase().includes(q) ||
      h.display_name.toLowerCase().includes(q) ||
      h.address.city?.toLowerCase().includes(q) ||
      h.address.country?.toLowerCase().includes(q)
  );

  try {
    const encoded = encodeURIComponent(query.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6&extratags=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'HauntlySpookyApp/1.0',
        },
      }
    );
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const nominatimResults: GeocodingResult[] = (data || []).map((item: any) => ({
        place_id: String(item.place_id),
        display_name: item.display_name || '',
        name: item.name || item.display_name?.split(',')[0] || 'Unknown Place',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.address || {},
        type: item.type || 'place',
      }));

      // Merge results avoiding duplicate coordinates
      const combined = [...matchedHotspots];
      for (const nr of nominatimResults) {
        if (!combined.some((c) => Math.abs(c.lat - nr.lat) < 0.01 && Math.abs(c.lon - nr.lon) < 0.01)) {
          combined.push(nr);
        }
      }
      return combined.slice(0, 8);
    }
  } catch {
    // If external fetch fails, return matched hotspots
  }

  return matchedHotspots.length > 0 ? matchedHotspots : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUGGEST A LOCATION (save + post chat card + add globe marker)
// ─────────────────────────────────────────────────────────────────────────────
export interface SuggestLocationParams {
  groupId: string;
  userId: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
}

export const LOCATION_PREFIX = '📍 __LOCATION_SUGGESTION__';

export async function suggestLocation(
  params: SuggestLocationParams
): Promise<{ location: GroupLocation | null; message: GroupMessage | null; error: Error | null }> {
  const { groupId, userId, name, address, description, latitude, longitude, category } = params;

  // 1. Save to group_locations (globeService handles both Supabase and local storage fallback)
  const { data: location, error: locError } = await addGroupLocation({
    group_id: groupId,
    name: name.trim(),
    address: address.trim(),
    description: description?.trim() || `A suggested nocturnal gathering point for the coven.`,
    latitude,
    longitude,
    suggested_by: userId,
    category: (category as any) || 'sanctuary',
  });

  if (locError || !location) {
    return {
      location: null,
      message: null,
      error: locError || new Error('Failed to save location to the realm database.'),
    };
  }

  // 2. Post a rich location suggestion card message in the group chat
  const locationPayload = JSON.stringify({
    type: 'location_suggestion',
    location_id: location.id,
    name: location.name,
    address: location.address,
    description: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    category: location.category,
  });

  const chatContent = `${LOCATION_PREFIX}${locationPayload}`;

  const { data: message, error: msgError } = await sendGroupMessage(groupId, userId, chatContent);

  if (msgError) {
    console.warn('Location was saved to globe but failed to post chat card:', msgError);
  }

  // 3. Dispatch update events for Globe and Chat components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hauntly_locations_update', { detail: { groupId } })
    );
    window.dispatchEvent(
      new CustomEvent('hauntly_location_suggested', {
        detail: { groupId, location, messageId: message?.id },
      })
    );
  }

  return { location, message: message || null, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PARSE LOCATION SUGGESTION FROM MESSAGE CONTENT
// ─────────────────────────────────────────────────────────────────────────────
export function isLocationSuggestionMessage(content: string): boolean {
  return typeof content === 'string' && content.startsWith(LOCATION_PREFIX);
}

export function parseLocationSuggestion(content: string): {
  location_id: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
} | null {
  if (!isLocationSuggestionMessage(content)) return null;
  try {
    const json = content.substring(LOCATION_PREFIX.length);
    const parsed = JSON.parse(json);
    return {
      location_id: parsed.location_id,
      name: parsed.name,
      address: parsed.address,
      description: parsed.description,
      latitude: Number(parsed.latitude),
      longitude: Number(parsed.longitude),
      category: parsed.category,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VOTE FOR A LOCATION (prevent duplicates with toggle functionality)
// ─────────────────────────────────────────────────────────────────────────────
export async function voteForLocation(
  locationId: string,
  userId: string,
  groupId: string
): Promise<{ action: 'voted' | 'unvoted'; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const votes = getStored<LocationVote>(LOCAL_VOTES_KEY);
    const existingIdx = votes.findIndex(
      (v) => v.location_id === locationId && v.user_id === userId
    );

    let action: 'voted' | 'unvoted';
    if (existingIdx >= 0) {
      votes.splice(existingIdx, 1);
      action = 'unvoted';
    } else {
      votes.push({
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        location_id: locationId,
        group_id: groupId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
      action = 'voted';
    }

    setStored(LOCAL_VOTES_KEY, votes);

    // Update vote_count on the stored location directly for convenience
    const locations = getStored<GroupLocation>(LOCAL_LOCATIONS_KEY);
    const targetLoc = locations.find((l) => l.id === locationId);
    if (targetLoc) {
      const locVotes = votes.filter((v) => v.location_id === locationId).length;
      targetLoc.vote_count = locVotes;
      setStored(LOCAL_LOCATIONS_KEY, locations);
    }

    // Broadcast across tabs and components
    localBroadcastChannel?.postMessage({
      type: 'location_vote_changed',
      groupId,
      locationId,
      userId,
      action,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_location_vote_changed', {
          detail: { groupId, locationId, userId, action },
        })
      );
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId } })
      );
    }

    return { action, error: null };
  }

  try {
    // Check if already voted
    const { data: existing } = await supabase
      .from('location_votes')
      .select('id')
      .eq('location_id', locationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Remove vote (toggle off)
      const { error } = await supabase.from('location_votes').delete().eq('id', existing.id);
      if (error) throw error;

      localBroadcastChannel?.postMessage({
        type: 'location_vote_changed',
        groupId,
        locationId,
        userId,
        action: 'unvoted',
      });

      return { action: 'unvoted', error: null };
    } else {
      // Add vote (1 vote per user per location enforced by table constraint)
      const { error } = await supabase.from('location_votes').insert({
        location_id: locationId,
        group_id: groupId,
        user_id: userId,
      });
      if (error) throw error;

      localBroadcastChannel?.postMessage({
        type: 'location_vote_changed',
        groupId,
        locationId,
        userId,
        action: 'voted',
      });

      return { action: 'voted', error: null };
    }
  } catch (err: unknown) {
    return {
      action: 'voted',
      error: err instanceof Error ? err : new Error('Failed to toggle vote'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FETCH VOTES FOR LOCATIONS IN A GROUP
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchLocationVotes(
  groupId: string,
  currentUserId: string
): Promise<{
  data: Map<string, { count: number; votedByUser: boolean; voterIds: string[] }>;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) {
    const votes = getStored<LocationVote>(LOCAL_VOTES_KEY);
    const locations = getStored<GroupLocation>(LOCAL_LOCATIONS_KEY);
    const groupLocationIds = new Set(
      locations.filter((l) => l.group_id === groupId).map((l) => l.id)
    );

    const map = new Map<string, { count: number; votedByUser: boolean; voterIds: string[] }>();

    for (const v of votes) {
      if (!groupLocationIds.has(v.location_id)) continue;
      const existing = map.get(v.location_id) || { count: 0, votedByUser: false, voterIds: [] };
      existing.count++;
      existing.voterIds.push(v.user_id);
      if (v.user_id === currentUserId) existing.votedByUser = true;
      map.set(v.location_id, existing);
    }

    return { data: map, error: null };
  }

  try {
    const { data: locationRows } = await supabase
      .from('group_locations')
      .select('id')
      .eq('group_id', groupId);

    if (!locationRows || locationRows.length === 0) {
      return { data: new Map(), error: null };
    }

    const locationIds = locationRows.map((r: any) => r.id);

    const { data: voteRows, error } = await supabase
      .from('location_votes')
      .select('*')
      .in('location_id', locationIds);

    if (error) throw error;

    const map = new Map<string, { count: number; votedByUser: boolean; voterIds: string[] }>();

    for (const v of voteRows || []) {
      const existing = map.get(v.location_id) || { count: 0, votedByUser: false, voterIds: [] };
      existing.count++;
      existing.voterIds.push(v.user_id);
      if (v.user_id === currentUserId) existing.votedByUser = true;
      map.set(v.location_id, existing);
    }

    return { data: map, error: null };
  } catch (err: unknown) {
    return {
      data: new Map(),
      error: err instanceof Error ? err : new Error('Failed to fetch votes'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MARK A FINAL SELECTED LOCATION (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function selectFinalLocation(
  locationId: string,
  groupId: string,
  adminUserId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const locations = getStored<GroupLocation>(LOCAL_LOCATIONS_KEY);
    for (const loc of locations) {
      if (loc.group_id === groupId) {
        loc.is_selected = loc.id === locationId;
        if (loc.is_selected) {
          loc.selected_by = adminUserId;
          loc.selected_at = new Date().toISOString();
        } else {
          loc.selected_by = undefined;
          loc.selected_at = undefined;
        }
      }
    }
    setStored(LOCAL_LOCATIONS_KEY, locations);

    localBroadcastChannel?.postMessage({
      type: 'location_selected',
      groupId,
      locationId,
      adminUserId,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId } })
      );
      window.dispatchEvent(
        new CustomEvent('hauntly_location_selected', { detail: { groupId, locationId } })
      );
    }

    return { error: null };
  }

  try {
    // 1. Verify user is group admin
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', adminUserId)
      .maybeSingle();

    if (!membership || membership.role !== 'admin') {
      return { error: new Error('Only coven admins can mark the final chosen sanctuary.') };
    }

    // 2. Unset previous selections for this group
    await supabase
      .from('group_locations')
      .update({ is_selected: false, selected_by: null, selected_at: null })
      .eq('group_id', groupId);

    // 3. Mark the new selection
    const { error } = await supabase
      .from('group_locations')
      .update({
        is_selected: true,
        selected_by: adminUserId,
        selected_at: new Date().toISOString(),
      })
      .eq('id', locationId);

    if (error) throw error;

    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to select location'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBSCRIBE TO LOCATION VOTES & SELECTIONS
// ─────────────────────────────────────────────────────────────────────────────
export function subscribeToLocationVotes(
  groupId: string,
  onUpdate: () => void
): () => void {
  let channel: any = null;
  if (isSupabaseConfigured) {
    channel = supabase
      .channel(`location_votes:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_votes',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_locations',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
  }

  const handleBroadcast = (event: MessageEvent) => {
    if (
      event.data &&
      (event.data.type === 'location_vote_changed' ||
        event.data.type === 'location_selected' ||
        event.data.type === 'location_added') &&
      event.data.groupId === groupId
    ) {
      onUpdate();
    }
  };
  localBroadcastChannel?.addEventListener('message', handleBroadcast);

  const handleWindowEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (!custom.detail || custom.detail.groupId === groupId) {
      onUpdate();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('hauntly_location_vote_changed', handleWindowEvent);
    window.addEventListener('hauntly_locations_update', handleWindowEvent);
    window.addEventListener('hauntly_location_selected', handleWindowEvent);
  }

  return () => {
    if (channel) {
      void supabase.removeChannel(channel);
    }
    localBroadcastChannel?.removeEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hauntly_location_vote_changed', handleWindowEvent);
      window.removeEventListener('hauntly_locations_update', handleWindowEvent);
      window.removeEventListener('hauntly_location_selected', handleWindowEvent);
    }
  };
}
