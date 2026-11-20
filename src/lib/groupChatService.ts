import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Group,
  GroupMember,
  GroupMessage,
  MessageReactionRow,
  ReactionSummary,
  RealtimeConnectionStatus,
  GroupRole,
} from '../types/groupChat';
import type { Profile } from '../types/profile';
import { getProfile } from './profileService';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Local storage keys for fallback/offline/local testing
const LOCAL_GROUPS_KEY = 'hauntly_local_groups';
const LOCAL_MEMBERS_KEY = 'hauntly_local_group_members';
const LOCAL_MESSAGES_KEY = 'hauntly_local_group_messages';
const LOCAL_REACTIONS_KEY = 'hauntly_local_group_reactions';

// BroadcastChannel for cross-tab communication in local demo mode
let localBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel('hauntly_realtime_group_chat');
  }
} catch {
  // BroadcastChannel unavailable
}

const inMemoryStorage = new Map<string, string>();

function getStored<T>(key: string): T[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }
    const mem = inMemoryStorage.get(key);
    return mem ? JSON.parse(mem) : [];
  } catch {
    return [];
  }
}

function setStored<T>(key: string, data: T[]) {
  try {
    const val = JSON.stringify(data);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    } else {
      inMemoryStorage.set(key, val);
    }
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
  }
}

/**
 * Companion profiles matching the reference mockup
 */
const COMPANION_PROFILES: Record<string, Profile> = {
  usr_austin: {
    id: 'usr_austin',
    username: 'austin',
    display_name: 'Austin',
    hauntly_id: 'HAUNT-AUSTN',
    avatar_url: '/chat/avatar_austin.png',
    avatar_selection: 'avatar_austin',
    status: 'active',
    bio: 'Digital sculptor & visual artist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_arthur: {
    id: 'usr_arthur',
    username: 'arthur',
    display_name: 'Arthur',
    hauntly_id: 'HAUNT-ARTHR',
    avatar_url: '/chat/avatar_arthur.png',
    avatar_selection: 'avatar_arthur',
    status: 'active',
    bio: 'Gothic typographer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_sabrina: {
    id: 'usr_sabrina',
    username: 'sabrina',
    display_name: 'Sabrina',
    hauntly_id: 'HAUNT-SABRN',
    avatar_url: '/chat/avatar_sabrina.png',
    avatar_selection: 'avatar_sabrina',
    status: 'active',
    bio: 'Nocturnal illustrator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_vanessa: {
    id: 'usr_vanessa',
    username: 'vanessa',
    display_name: 'Vanessa',
    hauntly_id: 'HAUNT-VANSS',
    avatar_url: '/chat/avatar_vanessa.png',
    avatar_selection: 'avatar_vanessa',
    status: 'active',
    bio: 'Shadow UI architect',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_sasha: {
    id: 'usr_sasha',
    username: 'sasha',
    display_name: 'Sasha',
    hauntly_id: 'HAUNT-SASHA',
    avatar_url: '/chat/avatar_sasha.png',
    avatar_selection: 'avatar_sasha',
    status: 'active',
    bio: 'Visual designer & creator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_saman: {
    id: 'usr_saman',
    username: 'saman',
    display_name: 'Saman Shafaei',
    hauntly_id: 'HAUNT-SAMAN',
    avatar_url: '/chat/avatar_saman.png',
    avatar_selection: 'avatar_saman',
    status: 'active',
    bio: 'Product visualizer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  usr_anastasia: {
    id: 'usr_anastasia',
    username: 'anastasia',
    display_name: 'Anastasia',
    hauntly_id: 'HAUNT-ANAST',
    avatar_url: '/chat/avatar_anastasia.png',
    avatar_selection: 'avatar_anastasia',
    status: 'active',
    bio: 'Art director & motion artist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * Seed initial group ("Designers") matching the WhatsApp-style reference mockup
 */
function ensureLocalSeedGroup(userId: string): Group {
  // Ensure companion profiles exist in local storage
  try {
    const raw = localStorage.getItem('hauntly_local_profiles');
    const existing = raw ? JSON.parse(raw) : {};
    let changed = false;
    for (const [k, v] of Object.entries(COMPANION_PROFILES)) {
      if (!existing[k]) {
        existing[k] = v;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem('hauntly_local_profiles', JSON.stringify(existing));
    }
  } catch {
    // Ignore in non-browser env
  }

  const groups = getStored<Group>(LOCAL_GROUPS_KEY);
  const designersExisting = groups.find((g) => g.id === 'grp_designers');

  if (designersExisting) {
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY);
    const inAny = members.some((m) => m.group_id === designersExisting.id && m.user_id === userId);
    if (!inAny) {
      members.push({
        id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        group_id: designersExisting.id,
        user_id: userId,
        role: 'admin',
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
      });
      setStored(LOCAL_MEMBERS_KEY, members);
    }
    return designersExisting;
  }

  const designersGroup: Group = {
    id: 'grp_designers',
    name: 'Designers',
    description: 'A creative space for designers, developers & dreamers. 🌙',
    avatar_url: '/chat/avatar_designers_hero.png',
    created_by: userId,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
    member_count: 40,
    unread_count: 0,
  };

  const defaultMembers: GroupMember[] = [
    {
      id: 'gm_designer_you',
      group_id: designersGroup.id,
      user_id: userId,
      role: 'admin',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_austin',
      group_id: designersGroup.id,
      user_id: 'usr_austin',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_arthur',
      group_id: designersGroup.id,
      user_id: 'usr_arthur',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_sabrina',
      group_id: designersGroup.id,
      user_id: 'usr_sabrina',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_vanessa',
      group_id: designersGroup.id,
      user_id: 'usr_vanessa',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_sasha',
      group_id: designersGroup.id,
      user_id: 'usr_sasha',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_saman',
      group_id: designersGroup.id,
      user_id: 'usr_saman',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
    {
      id: 'gm_designer_anastasia',
      group_id: designersGroup.id,
      user_id: 'usr_anastasia',
      role: 'member',
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    },
  ];

  // Seed initial conversation messages matching reference mockup
  const baseTime = Date.now() - 3600000;
  const initialMessages: GroupMessage[] = [
    {
      id: 'msg_sasha_1',
      group_id: designersGroup.id,
      sender_id: 'usr_sasha',
      content: "What's up guys! new visual today project?",
      created_at: new Date(baseTime + 60000).toISOString(),
      updated_at: new Date(baseTime + 60000).toISOString(),
      sender: COMPANION_PROFILES.usr_sasha,
      reactions: [],
      message_type: 'text',
    },
    {
      id: 'msg_saman_1',
      group_id: designersGroup.id,
      sender_id: 'usr_saman',
      content: 'Today the progress of the project is amazing 🔥',
      created_at: new Date(baseTime + 120000).toISOString(),
      updated_at: new Date(baseTime + 120000).toISOString(),
      sender: COMPANION_PROFILES.usr_saman,
      reactions: [
        {
          emoji: '🔥',
          count: 1,
          userIds: ['usr_sasha'],
          userReacted: false,
        },
      ],
      message_type: 'text',
    },
    {
      id: 'msg_self_1',
      group_id: designersGroup.id,
      sender_id: userId,
      content: 'Yes! 2 weeks I thought and I want to show it this. plz gt it!',
      created_at: new Date(baseTime + 240000).toISOString(),
      updated_at: new Date(baseTime + 240000).toISOString(),
      sender: {
        id: userId,
        username: 'you',
        display_name: 'You',
        hauntly_id: 'HV-YOU',
        avatar_url: '/chat/avatar_you_pumpkin.png',
        avatar_selection: 'avatar_witch_pumpkin',
        status: 'active',
        bio: 'Nocturnal companion',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      reactions: [],
      message_type: 'text',
    },
    {
      id: 'msg_sasha_voice',
      group_id: designersGroup.id,
      sender_id: 'usr_sasha',
      content: 'Voice message',
      created_at: new Date(baseTime + 300000).toISOString(),
      updated_at: new Date(baseTime + 300000).toISOString(),
      sender: COMPANION_PROFILES.usr_sasha,
      reactions: [],
      message_type: 'audio',
      audio_duration: '0:24',
    },
    {
      id: 'msg_anastasia_1',
      group_id: designersGroup.id,
      sender_id: 'usr_anastasia',
      content: 'I countn wait to see 🤤',
      created_at: new Date(baseTime + 420000).toISOString(),
      updated_at: new Date(baseTime + 420000).toISOString(),
      sender: COMPANION_PROFILES.usr_anastasia,
      reactions: [],
      message_type: 'text',
    },
    {
      id: 'msg_self_pdf',
      group_id: designersGroup.id,
      sender_id: userId,
      content: 'Project-Update.pdf',
      created_at: new Date(baseTime + 540000).toISOString(),
      updated_at: new Date(baseTime + 540000).toISOString(),
      sender: {
        id: userId,
        username: 'you',
        display_name: 'You',
        hauntly_id: 'HV-YOU',
        avatar_url: '/chat/avatar_you_pumpkin.png',
        avatar_selection: 'avatar_witch_pumpkin',
        status: 'active',
        bio: 'Nocturnal companion',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      reactions: [],
      message_type: 'file',
      file_name: 'Project-Update.pdf',
      file_size: '2.4 MB',
    },
  ];

  const currentGroups = getStored<Group>(LOCAL_GROUPS_KEY);
  setStored(LOCAL_GROUPS_KEY, [designersGroup, ...currentGroups]);

  const currentMembers = getStored<GroupMember>(LOCAL_MEMBERS_KEY);
  setStored(LOCAL_MEMBERS_KEY, [...defaultMembers, ...currentMembers]);

  const currentMessages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);
  setStored(LOCAL_MESSAGES_KEY, [...currentMessages, ...initialMessages]);

  return designersGroup;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FETCH USER GROUPS (With unread count & last message)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchUserGroups(
  userId: string
): Promise<{ data: Group[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    ensureLocalSeedGroup(userId);
    const groups = getStored<Group>(LOCAL_GROUPS_KEY);
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY);
    const messages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);

    // Filter to groups where current user is a member
    const userMemberships = members.filter((m) => m.user_id === userId);
    const myGroupIds = new Set(userMemberships.map((m) => m.group_id));

    const result: Group[] = [];
    for (const g of groups) {
      if (!myGroupIds.has(g.id)) continue;
      const membership = userMemberships.find((m) => m.group_id === g.id);
      const groupMessages = messages.filter((msg) => msg.group_id === g.id);
      const memberCount = members.filter((m) => m.group_id === g.id).length;

      // Last message
      const sorted = [...groupMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const last = sorted[0];

      // Unread count: messages newer than last_read_at
      const lastRead = membership?.last_read_at ? new Date(membership.last_read_at).getTime() : 0;
      const unreadCount = groupMessages.filter(
        (m) => m.sender_id !== userId && new Date(m.created_at).getTime() > lastRead
      ).length;

      result.push({
        ...g,
        member_count: memberCount,
        unread_count: unreadCount,
        last_message: last
          ? {
              id: last.id,
              content: last.content,
              sender_name: last.sender?.display_name || 'Spirit',
              created_at: last.created_at,
            }
          : null,
      });
    }

    return { data: result, error: null };
  }

  try {
    // 1. Get groups user belongs to
    const { data: memberRows, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, last_read_at')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (!memberRows || memberRows.length === 0) return { data: [], error: null };

    const groupIds = memberRows.map((r) => r.group_id);

    // 2. Fetch groups
    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (groupError) throw groupError;

    // 3. Enrich with member count and last message
    const enriched: Group[] = [];
    for (const g of groups || []) {
      const memberRow = memberRows.find((m) => m.group_id === g.id);
      const lastRead = memberRow?.last_read_at || new Date(0).toISOString();

      // Member count
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.id);

      // Last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:profiles!sender_id (display_name)
        `)
        .eq('group_id', g.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', g.id)
        .neq('sender_id', userId)
        .gt('created_at', lastRead);

      enriched.push({
        ...g,
        member_count: memberCount ?? 1,
        unread_count: unreadCount ?? 0,
        last_message: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              sender_name: (lastMsg as any).sender?.display_name || 'Spirit',
              created_at: lastMsg.created_at,
            }
          : null,
      });
    }

    return { data: enriched, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Failed to retrieve groups'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CREATE A NEW GROUP
// ─────────────────────────────────────────────────────────────────────────────
export async function createGroup(
  name: string,
  description: string | null,
  avatarUrl: string | null,
  creatorId: string,
  memberIds: string[] = []
): Promise<{ data: Group | null; error: Error | null }> {
  const cleanName = name.trim();
  if (cleanName.length < 2) {
    return { data: null, error: new Error('Group name must be at least 2 characters.') };
  }

  if (!isSupabaseConfigured) {
    const groups = getStored<Group>(LOCAL_GROUPS_KEY);
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY);

    const newGroup: Group = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      description: description?.trim() || null,
      avatar_url: avatarUrl || '/chat/avatar_designers_hero.png',
      created_by: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1 + memberIds.length,
      unread_count: 0,
    };

    // Add creator as admin
    const newMembers: GroupMember[] = [
      {
        id: `gm_${Date.now()}_creator`,
        group_id: newGroup.id,
        user_id: creatorId,
        role: 'admin',
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
      },
    ];

    // Add other members
    for (const uid of memberIds) {
      if (uid === creatorId) continue;
      newMembers.push({
        id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        group_id: newGroup.id,
        user_id: uid,
        role: 'member',
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
      });
    }

    setStored(LOCAL_GROUPS_KEY, [newGroup, ...groups]);
    setStored(LOCAL_MEMBERS_KEY, [...members, ...newMembers]);

    // Broadcast change
    localBroadcastChannel?.postMessage({
      type: 'group_created',
      group: newGroup,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }

    return { data: newGroup, error: null };
  }

  try {
    const { data: group, error: insertError } = await supabase
      .from('groups')
      .insert({
        name: cleanName,
        description: description?.trim() || null,
        avatar_url: avatarUrl || '/chat/avatar_designers_hero.png',
        created_by: creatorId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Add creator as admin
    const memberRows = [
      {
        group_id: group.id,
        user_id: creatorId,
        role: 'admin',
      },
      ...memberIds
        .filter((uid) => uid !== creatorId)
        .map((uid) => ({
          group_id: group.id,
          user_id: uid,
          role: 'member',
        })),
    ];

    const { error: memberError } = await supabase.from('group_members').insert(memberRows);
    if (memberError) console.warn('Error inserting members', memberError);

    return { data: group, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create group'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FETCH GROUP MEMBERS
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchGroupMembers(
  groupId: string
): Promise<{ data: GroupMember[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY).filter(
      (m) => m.group_id === groupId
    );
    const enriched: GroupMember[] = [];
    for (const m of members) {
      const p = await getProfile(m.user_id);
      enriched.push({
        ...m,
        profile: p.data || undefined,
      });
    }
    return { data: enriched, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        id,
        group_id,
        user_id,
        role,
        joined_at,
        last_read_at,
        profile:profiles!user_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    const list: GroupMember[] = (data || []).map((row: any) => ({
      id: row.id,
      group_id: row.group_id,
      user_id: row.user_id,
      role: row.role as GroupRole,
      joined_at: row.joined_at,
      last_read_at: row.last_read_at,
      profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
    }));

    return { data: list, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Failed to fetch group members'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADD MEMBER TO GROUP
// ─────────────────────────────────────────────────────────────────────────────
export async function addGroupMember(
  groupId: string,
  userId: string,
  role: GroupRole = 'member'
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY);
    if (members.some((m) => m.group_id === groupId && m.user_id === userId)) {
      return { error: null };
    }
    members.push({
      id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
      last_read_at: new Date().toISOString(),
    });
    setStored(LOCAL_MEMBERS_KEY, members);
    localBroadcastChannel?.postMessage({ type: 'member_added', groupId, userId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }
    return { error: null };
  }

  try {
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role,
    });
    if (error && error.code !== '23505') throw error;
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to add member to group'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FETCH GROUP MESSAGES (With Cursor Pagination & Reactions)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchGroupMessages(
  groupId: string,
  currentUserId: string,
  limit: number = 25,
  beforeTimestamp?: string
): Promise<{ data: GroupMessage[]; hasMore: boolean; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const all = getStored<GroupMessage>(LOCAL_MESSAGES_KEY).filter(
      (m) => m.group_id === groupId
    );
    const reactions = getStored<MessageReactionRow>(LOCAL_REACTIONS_KEY);

    // Sort descending by created_at for pagination
    let filtered = [...all].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (beforeTimestamp) {
      const beforeTime = new Date(beforeTimestamp).getTime();
      filtered = filtered.filter((m) => new Date(m.created_at).getTime() < beforeTime);
    }

    const slice = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;

    // Attach reaction summaries and sender profile
    const enriched: GroupMessage[] = [];
    for (const msg of slice) {
      const p = await getProfile(msg.sender_id);
      const msgReactions = reactions.filter((r) => r.message_id === msg.id);

      // Aggregate reactions
      const map = new Map<string, { count: number; userIds: string[]; userReacted: boolean }>();
      for (const r of msgReactions) {
        const cur = map.get(r.reaction) || { count: 0, userIds: [], userReacted: false };
        cur.count++;
        cur.userIds.push(r.user_id);
        if (r.user_id === currentUserId) cur.userReacted = true;
        map.set(r.reaction, cur);
      }

      const summaries: ReactionSummary[] = Array.from(map.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        userIds: data.userIds,
        userReacted: data.userReacted,
      }));

      enriched.push({
        ...msg,
        sender: p.data || undefined,
        reactions: summaries,
      });
    }

    // Return in ascending chronological order for chat view
    enriched.reverse();
    return { data: enriched, hasMore, error: null };
  }

  try {
    let query = supabase
      .from('messages')
      .select(`
        id,
        group_id,
        sender_id,
        content,
        created_at,
        updated_at,
        sender:profiles!sender_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    if (!rows || rows.length === 0) {
      return { data: [], hasMore: false, error: null };
    }

    const messageIds = rows.map((r) => r.id);

    // Fetch reactions for these messages
    const { data: reactionRows } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    const reactionMap = new Map<string, ReactionSummary[]>();
    for (const mid of messageIds) {
      const msgReactions = (reactionRows || []).filter((r) => r.message_id === mid);
      const emojiMap = new Map<string, { count: number; userIds: string[]; userReacted: boolean }>();

      for (const r of msgReactions) {
        const cur = emojiMap.get(r.reaction) || { count: 0, userIds: [], userReacted: false };
        cur.count++;
        cur.userIds.push(r.user_id);
        if (r.user_id === currentUserId) cur.userReacted = true;
        emojiMap.set(r.reaction, cur);
      }

      reactionMap.set(
        mid,
        Array.from(emojiMap.entries()).map(([emoji, d]) => ({
          emoji,
          count: d.count,
          userIds: d.userIds,
          userReacted: d.userReacted,
        }))
      );
    }

    const list: GroupMessage[] = rows.map((r: any) => ({
      id: r.id,
      group_id: r.group_id,
      sender_id: r.sender_id,
      content: r.content,
      created_at: r.created_at,
      updated_at: r.updated_at,
      sender: Array.isArray(r.sender) ? r.sender[0] : r.sender,
      reactions: reactionMap.get(r.id) || [],
    }));

    // Reverse to ascending order
    list.reverse();
    return { data: list, hasMore: rows.length === limit, error: null };
  } catch (err: unknown) {
    return {
      data: [],
      hasMore: false,
      error: err instanceof Error ? err : new Error('Failed to load group messages'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SEND GROUP MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
export async function sendGroupMessage(
  groupId: string,
  senderId: string,
  content: string
): Promise<{ data: GroupMessage | null; error: Error | null }> {
  const clean = content.trim();
  if (!clean) {
    return { data: null, error: new Error('Message cannot be empty.') };
  }

  if (!isSupabaseConfigured) {
    const messages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);
    const sender = await getProfile(senderId);

    const newMsg: GroupMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      group_id: groupId,
      sender_id: senderId,
      content: clean,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: sender.data || undefined,
      reactions: [],
    };

    messages.push(newMsg);
    setStored(LOCAL_MESSAGES_KEY, messages);

    // Update group updated_at
    const groups = getStored<Group>(LOCAL_GROUPS_KEY);
    const grp = groups.find((g) => g.id === groupId);
    if (grp) {
      grp.updated_at = newMsg.created_at;
      setStored(LOCAL_GROUPS_KEY, groups);
    }

    // Broadcast in real-time across tabs
    localBroadcastChannel?.postMessage({
      type: 'new_message',
      groupId,
      message: newMsg,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_new_message', { detail: { groupId, message: newMsg } })
      );
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }

    return { data: newMsg, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: senderId,
        content: clean,
      })
      .select(`
        id,
        group_id,
        sender_id,
        content,
        created_at,
        updated_at,
        sender:profiles!sender_id (id, hauntly_id, username, display_name, avatar_url, bio, created_at)
      `)
      .single();

    if (error) throw error;

    // Update group updated_at
    await supabase.from('groups').update({ updated_at: data.created_at }).eq('id', groupId);

    const message: GroupMessage = {
      id: data.id,
      group_id: data.group_id,
      sender_id: data.sender_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sender: Array.isArray((data as any).sender) ? (data as any).sender[0] : (data as any).sender,
      reactions: [],
    };

    return { data: message, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to send message'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6b. DELETE GROUP MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteGroupMessage(
  messageId: string,
  currentUserId: string,
  groupId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // 1. If Supabase is not configured, operate strictly on local storage
    if (!isSupabaseConfigured) {
      const messages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);
      const target = messages.find((m) => m.id === messageId);
      if (!target) {
        return { success: false, error: new Error('Message not found or already banished.') };
      }
      if (target.sender_id !== currentUserId) {
        return { success: false, error: new Error('You can only delete your own messages.') };
      }

      const filtered = messages.filter((m) => m.id !== messageId);
      setStored(LOCAL_MESSAGES_KEY, filtered);

      // Clean reactions
      const reactions = getStored<MessageReactionRow>(LOCAL_REACTIONS_KEY);
      setStored(
        LOCAL_REACTIONS_KEY,
        reactions.filter((r) => r.message_id !== messageId)
      );

      // Broadcast real-time deletion
      localBroadcastChannel?.postMessage({
        type: 'delete_message',
        groupId,
        messageId,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hauntly_delete_message', { detail: { groupId, messageId } })
        );
        window.dispatchEvent(new Event('hauntly_storage_update'));
      }

      return { success: true, error: null };
    }

    // 2. Supabase deletion with security validation
    const { data: targetMsg, error: fetchErr } = await supabase
      .from('messages')
      .select('id, sender_id, group_id')
      .eq('id', messageId)
      .single();

    if (fetchErr || !targetMsg) {
      // Check local storage fallback
      const messages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);
      const target = messages.find((m) => m.id === messageId);
      if (target && target.sender_id === currentUserId) {
        setStored(
          LOCAL_MESSAGES_KEY,
          messages.filter((m) => m.id !== messageId)
        );
        return { success: true, error: null };
      }
      return { success: false, error: new Error('Message not found or already banished.') };
    }

    if (targetMsg.sender_id !== currentUserId) {
      return { success: false, error: new Error('You can only delete your own messages.') };
    }

    // Clean reactions first
    await supabase.from('message_reactions').delete().eq('message_id', messageId);

    // Delete message
    const { error: delErr } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', currentUserId);

    if (delErr) throw delErr;

    // Clean local storage cache
    const messages = getStored<GroupMessage>(LOCAL_MESSAGES_KEY);
    setStored(
      LOCAL_MESSAGES_KEY,
      messages.filter((m) => m.id !== messageId)
    );

    // Broadcast across tabs
    localBroadcastChannel?.postMessage({
      type: 'delete_message',
      groupId,
      messageId,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hauntly_delete_message', { detail: { groupId, messageId } })
      );
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to banish message.'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TOGGLE MESSAGE REACTION (Add / Remove)
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleMessageReaction(
  messageId: string,
  userId: string,
  reaction: string,
  groupId: string
): Promise<{ action: 'added' | 'removed'; error: Error | null }> {
  if (!isSupabaseConfigured) {
    const reactions = getStored<MessageReactionRow>(LOCAL_REACTIONS_KEY);
    const existingIndex = reactions.findIndex(
      (r) => r.message_id === messageId && r.user_id === userId && r.reaction === reaction
    );

    let action: 'added' | 'removed' = 'added';
    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
      action = 'removed';
    } else {
      reactions.push({
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        message_id: messageId,
        user_id: userId,
        reaction,
        created_at: new Date().toISOString(),
      });
      action = 'added';
    }

    setStored(LOCAL_REACTIONS_KEY, reactions);
    localBroadcastChannel?.postMessage({
      type: 'reaction_toggled',
      groupId,
      messageId,
      userId,
      reaction,
      action,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }

    return { action, error: null };
  }

  try {
    // Check if already reacted
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('reaction', reaction)
      .maybeSingle();

    if (existing) {
      // Remove
      const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
      if (error) throw error;
      return { action: 'removed', error: null };
    } else {
      // Add
      const { error } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: userId,
        reaction,
      });
      if (error) throw error;
      return { action: 'added', error: null };
    }
  } catch (err: unknown) {
    return {
      action: 'added',
      error: err instanceof Error ? err : new Error('Failed to toggle reaction'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. MARK GROUP AS READ
// ─────────────────────────────────────────────────────────────────────────────
export async function markGroupAsRead(
  groupId: string,
  userId: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    const members = getStored<GroupMember>(LOCAL_MEMBERS_KEY);
    const m = members.find((x) => x.group_id === groupId && x.user_id === userId);
    if (m) {
      m.last_read_at = new Date().toISOString();
      setStored(LOCAL_MEMBERS_KEY, members);
      if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hauntly_storage_update'));
    }
    }
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('group_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to mark group as read'),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. REAL-TIME SUBSCRIPTION TO GROUP ROOM (Messages, Reactions, Typing, Presence)
// ─────────────────────────────────────────────────────────────────────────────
export interface GroupRoomSubscriptionParams {
  groupId: string;
  currentUserId: string;
  currentUserProfile: Profile;
  onNewMessage: (msg: GroupMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onMessageReactionUpdated: (messageId: string) => void;
  onTypingUpdated: (userId: string, displayName: string, isTyping: boolean) => void;
  onPresenceUpdated: (activeCount: number) => void;
  onStatusChange: (status: RealtimeConnectionStatus) => void;
}

export function subscribeToGroupRoom(params: {
  groupId: string;
  currentUserId: string;
  currentUserProfile: Profile;
  onNewMessage: (msg: GroupMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onMessageReactionUpdated: (messageId: string) => void;
  onTypingUpdated: (userId: string, displayName: string, isTyping: boolean) => void;
  onPresenceUpdated: (activeCount: number) => void;
  onStatusChange: (status: RealtimeConnectionStatus) => void;
}): () => void {
  const {
    groupId,
    currentUserId,
    currentUserProfile,
    onNewMessage,
    onMessageDeleted,
    onMessageReactionUpdated,
    onTypingUpdated,
    onPresenceUpdated,
    onStatusChange,
  } = params;

  setTimeout(() => onStatusChange('connecting'), 0);

  // A. FALLBACK / DEMO MODE (Using BroadcastChannel & window events)
  if (!isSupabaseConfigured) {
    setTimeout(() => {
      onStatusChange('connected');
      onPresenceUpdated(1);
    }, 0);

    const handleBroadcast = (evt: MessageEvent) => {
      const data = evt.data;
      if (!data) return;

      if (data.groupId && data.groupId !== groupId) return;

      if (data.type === 'new_message' && data.message) {
        onNewMessage(data.message);
      } else if (data.type === 'delete_message' && data.messageId) {
        if (onMessageDeleted) onMessageDeleted(data.messageId);
      } else if (data.type === 'reaction_toggled' && data.messageId) {
        onMessageReactionUpdated(data.messageId);
      } else if (data.type === 'typing') {
        if (data.userId !== currentUserId) {
          onTypingUpdated(data.userId, data.displayName, data.isTyping);
        }
      }
    };

    localBroadcastChannel?.addEventListener('message', handleBroadcast);

    const handleLocalNewMessage = (evt: Event) => {
      const custom = evt as CustomEvent;
      if (custom.detail?.groupId === groupId && custom.detail?.message) {
        onNewMessage(custom.detail.message);
      }
    };
    const handleLocalDeleteMessage = (evt: Event) => {
      const custom = evt as CustomEvent;
      if (custom.detail?.groupId === groupId && custom.detail?.messageId) {
        if (onMessageDeleted) onMessageDeleted(custom.detail.messageId);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hauntly_new_message', handleLocalNewMessage);
      window.addEventListener('hauntly_delete_message', handleLocalDeleteMessage);
    }

    // Online / Offline listener
    const handleOnline = () => onStatusChange('connected');
    const handleOffline = () => onStatusChange('offline');
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      localBroadcastChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('hauntly_new_message', handleLocalNewMessage);
        window.removeEventListener('hauntly_delete_message', handleLocalDeleteMessage);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }

  // B. REAL SUPABASE REALTIME CHANNEL
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase.channel(`group_room:${groupId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUserId },
      },
    });

    // 1. Listen for new messages inserted into DB
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      async (payload) => {
        const raw = payload.new as any;
        const p = await getProfile(raw.sender_id);
        const msg: GroupMessage = {
          id: raw.id,
          group_id: raw.group_id,
          sender_id: raw.sender_id,
          content: raw.content,
          created_at: raw.created_at,
          updated_at: raw.updated_at,
          sender: p.data || undefined,
          reactions: [],
        };
        onNewMessage(msg);
      }
    );

    // 1b. Listen for message deletion from DB
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const deletedId = (payload.old as any)?.id;
        if (deletedId && onMessageDeleted) {
          onMessageDeleted(deletedId);
        }
      }
    );

    // 2. Listen for reactions added or removed
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      },
      (payload) => {
        const mid = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
        if (mid) onMessageReactionUpdated(mid);
      }
    );

    // 3. Listen for typing broadcast
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload && payload.userId !== currentUserId) {
        onTypingUpdated(payload.userId, payload.displayName || 'Spirit', payload.isTyping);
      }
    });

    // 4. Track presence (online room members)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel?.presenceState() || {};
      const count = Object.keys(state).length;
      onPresenceUpdated(Math.max(1, count));
    });

    // 5. Subscribe and track status
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        onStatusChange('connected');
        // Track our presence in this room
        await channel?.track({
          user_id: currentUserId,
          display_name: currentUserProfile.display_name,
          online_at: new Date().toISOString(),
        });
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        onStatusChange('error');
      } else if (status === 'CLOSED') {
        onStatusChange('offline');
      }
    });

    // Online/offline handlers
    const handleOnline = () => {
      onStatusChange('connecting');
      channel?.subscribe();
    };
    const handleOffline = () => onStatusChange('offline');

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn('Realtime channel creation error', err);
    onStatusChange('error');
    return () => {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BROADCAST TYPING
// ─────────────────────────────────────────────────────────────────────────────
export async function broadcastTyping(
  groupId: string,
  userId: string,
  displayName: string,
  isTyping: boolean
) {
  if (!isSupabaseConfigured) {
    localBroadcastChannel?.postMessage({
      type: 'typing',
      groupId,
      userId,
      displayName,
      isTyping,
    });
    return;
  }

  try {
    const channel = supabase.channel(`group_room:${groupId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, displayName, isTyping },
    });
  } catch (err) {
    console.warn('Failed to broadcast typing', err);
  }
}
