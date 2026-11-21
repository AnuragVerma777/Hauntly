import { supabase, isSupabaseConfigured } from './supabase';
import type { Friendship, FriendEntry, RelationshipStatus, BlockRecord } from '../types/profile';
import { getProfile } from './profileService';

const LOCAL_FRIENDSHIPS_KEY = 'hauntly_local_friendships';
const LOCAL_BLOCKS_KEY = 'hauntly_local_blocks';

const INITIAL_FRIENDSHIPS_SEED: Friendship[] = [
  {
    id: 'seed_fr_jack',
    requester_id: 'default_current_user',
    addressee_id: 'usr_jack',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'seed_fr_vlad',
    requester_id: 'default_current_user',
    addressee_id: 'usr_vlad',
    status: 'accepted',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

let memoryFriendships: Friendship[] = [...INITIAL_FRIENDSHIPS_SEED];
let memoryBlocks: BlockRecord[] = [];

function getLocalFriendships(): Friendship[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_FRIENDSHIPS_KEY);
      if (raw) return JSON.parse(raw);
      localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(INITIAL_FRIENDSHIPS_SEED));
      return INITIAL_FRIENDSHIPS_SEED;
    }
  } catch {
    // ignore
  }
  return memoryFriendships;
}

function saveLocalFriendships(list: Friendship[]) {
  memoryFriendships = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }
  } catch (e) {
    console.warn('Failed to save friendships', e);
  }
}

function getLocalBlocks(): BlockRecord[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_BLOCKS_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {
    // ignore
  }
  return memoryBlocks;
}

function saveLocalBlocks(list: BlockRecord[]) {
  memoryBlocks = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_BLOCKS_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }
  } catch (e) {
    console.warn('Failed to save blocks', e);
  }
}

/**
 * Determine relationship status between current user and target user
 */
export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<RelationshipStatus> {
  if (currentUserId === targetUserId) {
    return 'self';
  }

  if (!isSupabaseConfigured) {
    const blocks = getLocalBlocks();
    const isBlocked = blocks.some(
      (b) =>
        (b.blocker_id === currentUserId && b.blocked_id === targetUserId) ||
        (b.blocker_id === targetUserId && b.blocked_id === currentUserId)
    );
    if (isBlocked) return 'blocked';

    const friendships = getLocalFriendships();
    const found = friendships.find(
      (f) =>
        (f.requester_id === currentUserId && f.addressee_id === targetUserId) ||
        (f.requester_id === targetUserId && f.addressee_id === currentUserId)
    );
    if (!found) return 'none';
    if (found.status === 'accepted') return 'friends';
    if (found.status === 'pending') {
      return found.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  }

  try {
    const { data: blockData } = await supabase
      .from('blocks')
      .select('id, blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
      .maybeSingle();

    if (blockData) {
      return 'blocked';
    }

    const { data: friendship, error: friendErr } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, sender_id, receiver_id, status')
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
      .maybeSingle();

    if (friendErr) {
      console.warn('Remote friendships query failed in getRelationshipStatus, checking local:', friendErr.message);
      const friendships = getLocalFriendships();
      const found = friendships.find(
        (f) =>
          (f.requester_id === currentUserId && f.addressee_id === targetUserId) ||
          (f.requester_id === targetUserId && f.addressee_id === currentUserId) ||
          (f.sender_id === currentUserId && f.receiver_id === targetUserId) ||
          (f.sender_id === targetUserId && f.receiver_id === currentUserId)
      );
      if (!found) return 'none';
      if (found.status === 'accepted') return 'friends';
      if (found.status === 'pending') {
        const isReq = found.requester_id === currentUserId || found.sender_id === currentUserId;
        return isReq ? 'pending_sent' : 'pending_received';
      }
      return 'none';
    }

    if (!friendship) {
      // Check local cache in case pending request was just created locally
      const friendships = getLocalFriendships();
      const found = friendships.find(
        (f) =>
          (f.requester_id === currentUserId && f.addressee_id === targetUserId) ||
          (f.requester_id === targetUserId && f.addressee_id === currentUserId) ||
          (f.sender_id === currentUserId && f.receiver_id === targetUserId) ||
          (f.sender_id === targetUserId && f.receiver_id === currentUserId)
      );
      if (found) {
        if (found.status === 'accepted') return 'friends';
        if (found.status === 'pending') {
          const isReq = found.requester_id === currentUserId || found.sender_id === currentUserId;
          return isReq ? 'pending_sent' : 'pending_received';
        }
      }
      return 'none';
    }

    if (friendship.status === 'accepted') {
      return 'friends';
    }

    if (friendship.status === 'pending') {
      const isReq = friendship.requester_id === currentUserId || (friendship as any).sender_id === currentUserId;
      return isReq ? 'pending_sent' : 'pending_received';
    }

    return 'none';
  } catch (err) {
    console.warn('Error checking relationship status, falling back to local:', err);
    const friendships = getLocalFriendships();
    const found = friendships.find(
      (f) =>
        (f.requester_id === currentUserId && f.addressee_id === targetUserId) ||
        (f.requester_id === targetUserId && f.addressee_id === currentUserId) ||
        (f.sender_id === currentUserId && f.receiver_id === targetUserId) ||
        (f.sender_id === targetUserId && f.receiver_id === currentUserId)
    );
    if (!found) return 'none';
    if (found.status === 'accepted') return 'friends';
    if (found.status === 'pending') {
      const isReq = found.requester_id === currentUserId || found.sender_id === currentUserId;
      return isReq ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  }
}

/**
 * Dispatch a friend request
 */
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<{ data: Friendship | null; error: Error | null }> {
  if (requesterId === addresseeId) {
    return { data: null, error: new Error('You cannot bind a friendship pact with your own spirit.') };
  }

  try {
    const status = await getRelationshipStatus(requesterId, addresseeId);
    if (status === 'friends') {
      return { data: null, error: new Error('You are already bound as friends in the Coven.') };
    }
    if (status === 'pending_sent') {
      return { data: null, error: new Error('A spectral request has already been dispatched to this spirit.') };
    }
    if (status === 'pending_received') {
      return { data: null, error: new Error('This spirit has already summoned you! Accept their pending request instead.') };
    }
    if (status === 'blocked') {
      return { data: null, error: new Error('Unable to send request to this soul due to ethereal wards.') };
    }

    const [reqProf, addProf] = await Promise.all([
      getProfile(requesterId),
      getProfile(addresseeId),
    ]);

    const localFriendship: Friendship = {
      id: 'req_' + Math.random().toString(36).substring(2, 9),
      requester_id: requesterId,
      addressee_id: addresseeId,
      sender_id: requesterId,
      receiver_id: addresseeId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      requester: reqProf.data || undefined,
      addressee: addProf.data || undefined,
    };

    if (!isSupabaseConfigured) {
      const list = getLocalFriendships();
      list.push(localFriendship);
      saveLocalFriendships(list);
      return { data: localFriendship, error: null };
    }

    try {
      // Insert with both naming conventions (requester_id/addressee_id & sender_id/receiver_id)
      let data: any = null;
      let error: any = null;

      const firstAttempt = await supabase
        .from('friendships')
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          sender_id: requesterId,
          receiver_id: addresseeId,
          status: 'pending',
        })
        .select('id, requester_id, addressee_id, sender_id, receiver_id, status, created_at, updated_at')
        .single();

      data = firstAttempt.data;
      error = firstAttempt.error;

      // If columns sender_id/receiver_id don't exist yet in remote table, retry with standard columns
      if (error && error.message.includes('column')) {
        const retry = await supabase
          .from('friendships')
          .insert({
            requester_id: requesterId,
            addressee_id: addresseeId,
            status: 'pending',
          })
          .select('id, requester_id, addressee_id, status, created_at, updated_at')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        if (error.code === '23505') {
          return { data: null, error: new Error('A spectral request has already been bound with this spirit.') };
        }
        // If table missing (PGRST205), fall back to local friendship
        console.warn('Supabase remote insert failed for friendships, using local fallback:', error.message);
        const list = getLocalFriendships();
        list.push(localFriendship);
        saveLocalFriendships(list);
        return { data: localFriendship, error: null };
      }

      if (data) {
        // Synchronize into local storage
        const list = getLocalFriendships();
        const existingIdx = list.findIndex((f) => f.id === data.id);
        const merged = { ...localFriendship, ...data };
        if (existingIdx >= 0) {
          list[existingIdx] = merged;
        } else {
          list.push(merged);
        }
        saveLocalFriendships(list);
        return { data: merged, error: null };
      }
    } catch (insertErr) {
      console.warn('Exception during remote friend request, applying local fallback:', insertErr);
      const list = getLocalFriendships();
      list.push(localFriendship);
      saveLocalFriendships(list);
      return { data: localFriendship, error: null };
    }

    return { data: localFriendship, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to send friend request') };
  }
}

/**
 * Accept an incoming friend request
 */
export async function acceptFriendRequest(
  friendshipId: string,
  currentUserId: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Always update local storage first so UI reacts immediately
    const list = getLocalFriendships();
    const target = list.find((f) => f.id === friendshipId && (f.addressee_id === currentUserId || f.receiver_id === currentUserId));
    if (target) {
      target.status = 'accepted';
      target.updated_at = new Date().toISOString();
      saveLocalFriendships(list);
    }

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    // 2. Persist to remote Supabase friendships table
    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .or(`addressee_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (error) {
      console.warn('Supabase remote acceptFriendRequest failed, local status kept:', error.message);
      return { error: null }; // Local state updated, do not fail user interaction
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to accept request') };
  }
}

/**
 * Reject / Decline an incoming friend request
 */
export async function rejectFriendRequest(
  friendshipId: string,
  currentUserId: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Always update local storage first
    const list = getLocalFriendships();
    const next = list.filter((f) => !(f.id === friendshipId && (f.addressee_id === currentUserId || f.receiver_id === currentUserId)));
    saveLocalFriendships(next);

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    // 2. Persist to remote Supabase friendships table
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`addressee_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (error) {
      console.warn('Supabase remote rejectFriendRequest failed, local status kept:', error.message);
      return { error: null };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to reject request') };
  }
}

/**
 * Cancel a dispatched friend request
 */
export async function cancelFriendRequest(
  friendshipId: string,
  currentUserId: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Always update local storage first
    const list = getLocalFriendships();
    const next = list.filter((f) => !(f.id === friendshipId && (f.requester_id === currentUserId || f.sender_id === currentUserId)));
    saveLocalFriendships(next);

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    // 2. Persist to remote Supabase friendships table
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`requester_id.eq.${currentUserId},sender_id.eq.${currentUserId}`)
      .eq('status', 'pending');

    if (error) {
      console.warn('Supabase remote cancelFriendRequest failed, local status kept:', error.message);
      return { error: null };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to cancel request') };
  }
}

/**
 * Sever a friendship connection
 */
export async function removeFriend(
  friendshipId: string,
  currentUserId: string
): Promise<{ error: Error | null }> {
  try {
    // 1. Always update local storage first
    const list = getLocalFriendships();
    const next = list.filter(
      (f) =>
        !(
          f.id === friendshipId &&
          (f.requester_id === currentUserId ||
            f.addressee_id === currentUserId ||
            f.sender_id === currentUserId ||
            f.receiver_id === currentUserId)
        )
    );
    saveLocalFriendships(next);

    // Also update local conversations if applicable
    if (typeof localStorage !== 'undefined') {
      const convKey = `hauntly_conversations_${currentUserId}`;
      const raw = localStorage.getItem(convKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((c) => c.id !== friendshipId && c.partnerId !== friendshipId);
            localStorage.setItem(convKey, JSON.stringify(updated));
          }
        } catch {
          // ignore
        }
      }
      window.dispatchEvent(new CustomEvent('hauntly_conversations_updated'));
    }

    if (!isSupabaseConfigured) {
      return { error: null };
    }

    // 2. Safely attempt delete on Supabase without throwing missing table error
    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId},sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
    } catch {
      // friendships table might be absent in Direct Messaging mode
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to remove friend') };
  }
}

/**
 * Block a user: adds to blocks and dissolves existing friendships
 */
export async function blockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ error: Error | null }> {
  if (currentUserId === targetUserId) {
    return { error: new Error('You cannot banish your own soul.') };
  }

  try {
    // Update local conversations
    if (typeof localStorage !== 'undefined') {
      const convKey = `hauntly_conversations_${currentUserId}`;
      const raw = localStorage.getItem(convKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((c) => c.partnerId !== targetUserId);
            localStorage.setItem(convKey, JSON.stringify(updated));
          }
        } catch {
          // ignore
        }
      }
      window.dispatchEvent(new CustomEvent('hauntly_conversations_updated'));
    }

    if (!isSupabaseConfigured) {
      const blocks = getLocalBlocks();
      if (!blocks.some((b) => b.blocker_id === currentUserId && b.blocked_id === targetUserId)) {
        const blockedProfile = await getProfile(targetUserId);
        blocks.push({
          id: 'blk_' + Math.random().toString(36).substring(2, 9),
          blocker_id: currentUserId,
          blocked_id: targetUserId,
          created_at: new Date().toISOString(),
          blocked_profile: blockedProfile.data || undefined,
        });
        saveLocalBlocks(blocks);
      }
      // Remove friendship
      const list = getLocalFriendships();
      const next = list.filter(
        (f) =>
          !(
            (f.requester_id === currentUserId && f.addressee_id === targetUserId) ||
            (f.requester_id === targetUserId && f.addressee_id === currentUserId)
          )
      );
      saveLocalFriendships(next);
      return { error: null };
    }

    const { error: blockError } = await supabase
      .from('blocks')
      .insert({
        blocker_id: currentUserId,
        blocked_id: targetUserId,
      });

    if (blockError && blockError.code !== '23505') {
      return { error: new Error(blockError.message) };
    }

    try {
      await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`);
    } catch {
      // friendships table might be absent in Direct Messaging mode
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to block spirit') };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      const blocks = getLocalBlocks();
      const next = blocks.filter(
        (b) => !(b.blocker_id === currentUserId && b.blocked_id === targetUserId)
      );
      saveLocalBlocks(next);
      return { error: null };
    }

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', targetUserId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to unblock spirit') };
  }
}

/**
 * Fetch all accepted friends with profile data
 */
export async function fetchAcceptedFriends(
  currentUserId: string
): Promise<{ data: FriendEntry[]; error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      const list = getLocalFriendships();
      const accepted = list.filter(
        (f) =>
          f.status === 'accepted' &&
          (f.requester_id === currentUserId ||
            f.addressee_id === currentUserId ||
            f.requester_id === 'default_current_user')
      );
      const entries: FriendEntry[] = [];
      for (const row of accepted) {
        const isRequester = row.requester_id === currentUserId || row.requester_id === 'default_current_user';
        const friendId = isRequester ? row.addressee_id : row.requester_id;
        let friend = isRequester ? row.addressee : row.requester;
        if (!friend) {
          const fetched = await getProfile(friendId);
          if (fetched.data) friend = fetched.data;
        }
        if (friend) {
          entries.push({
            friendshipId: row.id,
            friend,
            status: 'accepted',
            isRequester,
            createdAt: row.created_at,
          });
        }
      }
      return { data: entries, error: null };
    }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!requester_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at),
        addressee:profiles!addressee_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Remote friendships query failed, falling back to local:', error.message);
      const list = getLocalFriendships();
      const accepted = list.filter(
        (f) =>
          f.status === 'accepted' &&
          (f.requester_id === currentUserId ||
            f.addressee_id === currentUserId ||
            f.requester_id === 'default_current_user')
      );
      const entries: FriendEntry[] = [];
      for (const row of accepted) {
        const isRequester = row.requester_id === currentUserId || row.requester_id === 'default_current_user';
        const friendId = isRequester ? row.addressee_id : row.requester_id;
        let friend = isRequester ? row.addressee : row.requester;
        if (!friend) {
          const fetched = await getProfile(friendId);
          if (fetched.data) friend = fetched.data;
        }
        if (friend) {
          entries.push({
            friendshipId: row.id,
            friend,
            status: 'accepted',
            isRequester,
            createdAt: row.created_at,
          });
        }
      }
      return { data: entries, error: null };
    }

    const entries: FriendEntry[] = (data || []).map((row: any) => {
      const isRequester = row.requester_id === currentUserId;
      const friendProfile = isRequester ? row.addressee : row.requester;
      return {
        friendshipId: row.id,
        friend: friendProfile,
        status: row.status,
        isRequester,
        createdAt: row.created_at,
      };
    }).filter((e) => Boolean(e.friend));

    return { data: entries, error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error('Failed to fetch friends') };
  }
}

/**
 * Fetch pending friend requests (both received and sent)
 */
export async function fetchPendingRequests(
  currentUserId: string
): Promise<{
  received: Friendship[];
  sent: Friendship[];
  error: Error | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      const list = getLocalFriendships();
      const received = list.filter((f) => f.status === 'pending' && f.addressee_id === currentUserId);
      const sent = list.filter(
        (f) =>
          f.status === 'pending' &&
          (f.requester_id === currentUserId || f.requester_id === 'default_current_user')
      );

      // Populate profiles if missing
      for (const r of received) {
        if (!r.requester) {
          const p = await getProfile(r.requester_id);
          if (p.data) r.requester = p.data;
        }
      }
      for (const s of sent) {
        if (!s.addressee) {
          const p = await getProfile(s.addressee_id);
          if (p.data) s.addressee = p.data;
        }
      }

      return { received, sent, error: null };
    }

    const [receivedRes, sentRes] = await Promise.all([
      supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at,
          requester:profiles!requester_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
        `)
        .eq('status', 'pending')
        .eq('addressee_id', currentUserId)
        .order('created_at', { ascending: false }),

      supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at,
          addressee:profiles!addressee_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
        `)
        .eq('status', 'pending')
        .eq('requester_id', currentUserId)
        .order('created_at', { ascending: false }),
    ]);

    if (receivedRes.error || sentRes.error) {
      console.warn('Remote pending requests query failed, falling back to local');
      const list = getLocalFriendships();
      const received = list.filter((f) => f.status === 'pending' && f.addressee_id === currentUserId);
      const sent = list.filter(
        (f) =>
          f.status === 'pending' &&
          (f.requester_id === currentUserId || f.requester_id === 'default_current_user')
      );

      for (const r of received) {
        if (!r.requester) {
          const p = await getProfile(r.requester_id);
          if (p.data) r.requester = p.data;
        }
      }
      for (const s of sent) {
        if (!s.addressee) {
          const p = await getProfile(s.addressee_id);
          if (p.data) s.addressee = p.data;
        }
      }
      return { received, sent, error: null };
    }

    return {
      received: (receivedRes.data as any[]) || [],
      sent: (sentRes.data as any[]) || [],
      error: null,
    };
  } catch (err: unknown) {
    return {
      received: [],
      sent: [],
      error: err instanceof Error ? err : new Error('Failed to fetch requests'),
    };
  }
}

/**
 * Fetch list of blocked users
 */
export async function fetchBlockedUsers(
  currentUserId: string
): Promise<{ data: BlockRecord[]; error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      const blocks = getLocalBlocks();
      const myBlocks = blocks.filter((b) => b.blocker_id === currentUserId);
      for (const b of myBlocks) {
        if (!b.blocked_profile) {
          const p = await getProfile(b.blocked_id);
          if (p.data) b.blocked_profile = p.data;
        }
      }
      return { data: myBlocks, error: null };
    }

    const { data, error } = await supabase
      .from('blocks')
      .select(`
        id,
        blocker_id,
        blocked_id,
        created_at,
        blocked_profile:profiles!blocked_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
      `)
      .eq('blocker_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Remote blocks query failed, falling back to local:', error.message);
      const blocks = getLocalBlocks();
      const myBlocks = blocks.filter((b) => b.blocker_id === currentUserId);
      for (const b of myBlocks) {
        if (!b.blocked_profile) {
          const p = await getProfile(b.blocked_id);
          if (p.data) b.blocked_profile = p.data;
        }
      }
      return { data: myBlocks, error: null };
    }

    return { data: (data as any[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err : new Error('Failed to fetch blocked users') };
  }
}
