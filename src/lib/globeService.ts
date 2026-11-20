import { supabase, isSupabaseConfigured } from './supabase';
import type { GroupLocation, GroupLocationInsert } from '../types/globe';
import { getProfile } from './profileService';

const LOCAL_LOCATIONS_KEY = 'hauntly_local_group_locations';
const LOCAL_VOTES_KEY = 'hauntly_local_location_votes';

// Cross-tab broadcast channel for local development
let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel('hauntly_realtime_group_chat');
  }
} catch {
  // BroadcastChannel unavailable
}

let memoryLocations: GroupLocation[] = [];

function getStoredLocations(): GroupLocation[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_LOCATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {
    // fallback
  }
  return memoryLocations;
}

function setStoredLocations(data: GroupLocation[]) {
  memoryLocations = data;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(data));
    }
  } catch {
    // fallback
  }
}

/**
 * Curated authentic global haunted and gothic sanctuaries
 */
const SEED_LOCATIONS: Omit<GroupLocation, 'id' | 'created_at'>[] = [
  {
    group_id: 'grp_designers',
    name: "Bran Castle (Dracula's Fortress)",
    address: 'Strada General Traian Moșoiu 24, Bran 507025, Romania',
    description:
      'Perched high on a 200-foot jagged cliff in Transylvania, this legendary 14th-century gothic citadel resonates with ancient folklore and nocturnal sanctuary lore.',
    latitude: 45.5152,
    longitude: 25.3672,
    suggested_by: 'usr_sasha',
    category: 'sanctuary',
  },
  {
    group_id: 'grp_designers',
    name: 'Salem Witch House (Corwin Estate)',
    address: '310 Essex St, Salem, MA 01970, USA',
    description:
      'The only direct historic structure still standing in Salem with direct ties to the 1692 witch trials. Preserved in perpetual shadow and spectral fortitude.',
    latitude: 42.5211,
    longitude: -70.8985,
    suggested_by: 'usr_saman',
    category: 'historic',
  },
  {
    group_id: 'grp_designers',
    name: "Catacombs of Paris (L'Empire de la Mort)",
    address: '1 Avenue du Colonel Henri Rol-Tanguy, 75014 Paris, France',
    description:
      'Underground ossuary labyrinths holding the remains of over six million souls beneath the City of Light, carved from ancient limestone quarries.',
    latitude: 48.8338,
    longitude: 2.3324,
    suggested_by: 'usr_anastasia',
    category: 'crypt',
  },
  {
    group_id: 'grp_designers',
    name: 'Sedlec Ossuary (Church of Bones)',
    address: 'Zámecká, 284 03 Kutná Hora, Czech Republic',
    description:
      'A small Roman Catholic chapel artistic arranged with the skeletal remains of over 40,000 people, including a majestic chandelier of bones and skulls.',
    latitude: 49.9618,
    longitude: 15.2881,
    suggested_by: 'usr_austin',
    category: 'sanctuary',
  },
  {
    group_id: 'grp_designers',
    name: 'Edinburgh Castle & Greyfriars Kirkyard',
    address: 'Castlehill, Edinburgh EH1 2NG, Scotland, UK',
    description:
      'Gothic fortress built atop Castle Rock overlooking foggy cobblestone alleys and the haunted vaults of Greyfriars Kirkyard.',
    latitude: 55.9486,
    longitude: -3.1999,
    suggested_by: 'usr_arthur',
    category: 'historic',
  },
  {
    group_id: 'grp_designers',
    name: 'Bhangarh Fort (Cursed Ruins of Rajasthan)',
    address: 'Gola ka baas, Rajgarh Tehsil, Alwar, Rajasthan 301410, India',
    description:
      'A 16th-century fortified citadel renowned for its architectural grandeur and strict sunset-to-sunrise entry bans due to legendary nocturnal curses.',
    latitude: 27.0964,
    longitude: 76.2862,
    suggested_by: 'usr_sabrina',
    category: 'coven_hall',
  },
  {
    group_id: 'grp_designers',
    name: 'Aokigahara (Sea of Trees)',
    address: 'Fujikawaguchiko, Minamitsuru District, Yamanashi 401-0300, Japan',
    description:
      'An extraordinarily dense woodland sitting on volcanic basalt on the northwestern flank of Mount Fuji, rich with quiet folklore and magnetic anomaly rumors.',
    latitude: 35.4745,
    longitude: 138.6496,
    suggested_by: 'usr_vanessa',
    category: 'observatory',
  },
  {
    group_id: 'grp_designers',
    name: 'Tower of London & Traitors Gate',
    address: 'London EC3N 4AB, United Kingdom',
    description:
      'Historic riverside citadel famed for royal imprisonments, ancient ravens, and perpetual whispers along the Thames.',
    latitude: 51.5081,
    longitude: -0.0759,
    suggested_by: 'usr_austin',
    category: 'historic',
  },
];

/**
 * Ensure initial seed locations exist in local demo mode
 */
function ensureSeedLocations(groupId: string): GroupLocation[] {
  let existing = getStoredLocations();
  const forGroup = existing.filter((loc) => loc.group_id === groupId);

  if (forGroup.length === 0) {
    const toSeed: GroupLocation[] = SEED_LOCATIONS.map((seed, idx) => ({
      ...seed,
      group_id: groupId,
      id: `loc_${groupId}_${idx}_${Date.now()}`,
      created_at: new Date(Date.now() - idx * 3600000).toISOString(),
    }));
    existing = [...toSeed, ...existing];
    setStoredLocations(existing);
    return toSeed;
  }

  return forGroup;
}

/**
 * Fetch all locations for a specific group with profile enrichment and vote stats
 */
export async function fetchGroupLocations(
  groupId: string
): Promise<{ data: GroupLocation[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const rawList = ensureSeedLocations(groupId);
    let localVotes: Array<{ location_id: string; user_id: string }> = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const vRaw = localStorage.getItem(LOCAL_VOTES_KEY);
        if (vRaw) localVotes = JSON.parse(vRaw);
      }
    } catch {
      // ignore
    }

    const enriched: GroupLocation[] = [];

    for (const loc of rawList) {
      const p = await getProfile(loc.suggested_by);
      const vCount = localVotes.filter((v) => v.location_id === loc.id).length;
      enriched.push({
        ...loc,
        vote_count: vCount,
        suggested_by_profile: p.data || undefined,
      });
    }

    // Find leading location
    let maxVotes = 0;
    let maxId = '';
    for (const l of enriched) {
      if ((l.vote_count || 0) > maxVotes) {
        maxVotes = l.vote_count || 0;
        maxId = l.id;
      }
    }
    for (const l of enriched) {
      l.leading_location = maxVotes > 0 && l.id === maxId;
    }

    // Sort: selected first, then by votes desc, then created_at desc
    enriched.sort((a, b) => {
      if (a.is_selected && !b.is_selected) return -1;
      if (!a.is_selected && b.is_selected) return 1;
      if ((b.vote_count || 0) !== (a.vote_count || 0)) {
        return (b.vote_count || 0) - (a.vote_count || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { data: enriched, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('group_locations')
      .select(`
        id,
        group_id,
        name,
        address,
        description,
        latitude,
        longitude,
        suggested_by,
        category,
        is_selected,
        selected_by,
        selected_at,
        created_at,
        updated_at,
        suggested_by_profile:profiles!suggested_by (
          id,
          hauntly_id,
          username,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch votes for these locations
    const locationIds = (data || []).map((r: any) => r.id);
    let voteCounts: Record<string, number> = {};
    if (locationIds.length > 0) {
      try {
        const { data: vData } = await supabase
          .from('location_votes')
          .select('location_id')
          .in('location_id', locationIds);
        for (const row of vData || []) {
          voteCounts[row.location_id] = (voteCounts[row.location_id] || 0) + 1;
        }
      } catch {
        // ignore
      }
    }

    let maxVotes = 0;
    let maxId = '';
    for (const [id, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        maxId = id;
      }
    }

    const formatted: GroupLocation[] = (data || []).map((row: any) => ({
      id: row.id,
      group_id: row.group_id,
      name: row.name,
      address: row.address,
      description: row.description,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      suggested_by: row.suggested_by,
      category: row.category,
      is_selected: !!row.is_selected,
      selected_by: row.selected_by,
      selected_at: row.selected_at,
      vote_count: voteCounts[row.id] || 0,
      leading_location: maxVotes > 0 && row.id === maxId,
      created_at: row.created_at,
      updated_at: row.updated_at,
      suggested_by_profile: Array.isArray(row.suggested_by_profile)
        ? row.suggested_by_profile[0]
        : row.suggested_by_profile,
    }));

    // If database returned empty for this group, fall back to seed data
    if (formatted.length === 0) {
      const fallbackList = ensureSeedLocations(groupId);
      const enriched: GroupLocation[] = [];
      for (const loc of fallbackList) {
        const p = await getProfile(loc.suggested_by);
        enriched.push({
          ...loc,
          suggested_by_profile: p.data || undefined,
        });
      }
      return { data: enriched, error: null };
    }

    return { data: formatted, error: null };
  } catch (err: unknown) {
    console.warn('Error fetching group locations, falling back to local storage:', err);
    const rawList = ensureSeedLocations(groupId);
    return { data: rawList, error: null };
  }
}

/**
 * Add a new location to a group
 */
export async function addGroupLocation(
  location: GroupLocationInsert
): Promise<{ data: GroupLocation | null; error: Error | null }> {
  const cleanName = location.name.trim();
  const cleanAddress = location.address.trim();

  if (cleanName.length < 2) {
    return { data: null, error: new Error('Location name must be at least 2 characters.') };
  }
  if (!cleanAddress) {
    return { data: null, error: new Error('Address is required.') };
  }
  if (location.latitude < -90 || location.latitude > 90) {
    return { data: null, error: new Error('Latitude must be between -90 and 90.') };
  }
  if (location.longitude < -180 || location.longitude > 180) {
    return { data: null, error: new Error('Longitude must be between -180 and 180.') };
  }

  const profileRes = await getProfile(location.suggested_by);

  if (!isSupabaseConfigured) {
    const newLoc: GroupLocation = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      group_id: location.group_id,
      name: cleanName,
      address: cleanAddress,
      description: location.description?.trim() || '',
      latitude: location.latitude,
      longitude: location.longitude,
      suggested_by: location.suggested_by,
      category: location.category || 'sanctuary',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      suggested_by_profile: profileRes.data || undefined,
    };

    const current = getStoredLocations();
    setStoredLocations([newLoc, ...current]);

    // Cross-tab broadcast & event
    localBroadcastChannel?.postMessage({
      type: 'location_added',
      groupId: location.group_id,
      location: newLoc,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId: location.group_id } })
      );
    }

    return { data: newLoc, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('group_locations')
      .insert({
        group_id: location.group_id,
        name: cleanName,
        address: cleanAddress,
        description: location.description?.trim() || '',
        latitude: location.latitude,
        longitude: location.longitude,
        suggested_by: location.suggested_by,
        category: location.category || 'sanctuary',
      })
      .select()
      .single();

    if (error) throw error;

    const createdLoc: GroupLocation = {
      ...data,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      suggested_by_profile: profileRes.data || undefined,
    };

    // Broadcast change
    localBroadcastChannel?.postMessage({
      type: 'location_added',
      groupId: location.group_id,
      location: createdLoc,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId: location.group_id } })
      );
    }

    return { data: createdLoc, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to insert location'),
    };
  }
}

/**
 * Delete a location from a group
 */
export async function deleteGroupLocation(
  locationId: string,
  groupId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const current = getStoredLocations();
    setStoredLocations(current.filter((l) => l.id !== locationId));

    localBroadcastChannel?.postMessage({
      type: 'location_deleted',
      groupId,
      locationId,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId } })
      );
    }

    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('group_locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;

    localBroadcastChannel?.postMessage({
      type: 'location_deleted',
      groupId,
      locationId,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_locations_update', { detail: { groupId } })
      );
    }

    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete location'),
    };
  }
}

/**
 * Real-time subscription for group location updates
 */
export function subscribeToGroupLocations(
  groupId: string,
  onUpdate: () => void
): () => void {
  // 1. Supabase Realtime subscription
  let channel: any = null;
  if (isSupabaseConfigured) {
    channel = supabase
      .channel(`group_locations:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

  // 2. BroadcastChannel cross-tab subscription
  const handleBroadcast = (event: MessageEvent) => {
    if (
      event.data &&
      (event.data.type === 'location_added' || event.data.type === 'location_deleted') &&
      event.data.groupId === groupId
    ) {
      onUpdate();
    }
  };
  localBroadcastChannel?.addEventListener('message', handleBroadcast);

  // 3. Custom Window Event
  const handleWindowEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (!custom.detail || custom.detail.groupId === groupId) {
      onUpdate();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('hauntly_locations_update', handleWindowEvent);
  }

  return () => {
    if (channel) {
      void supabase.removeChannel(channel);
    }
    localBroadcastChannel?.removeEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hauntly_locations_update', handleWindowEvent);
    }
  };
}
