import { supabase, isSupabaseConfigured } from './supabase';
import type { Profile } from '../types/profile';
import { getProfile } from './profileService';
import {
  type ChatMessage,
  getDirectChatKey,
  fetchDirectMessages as fetchLocalWhisperMessages,
  sendDirectMessage as sendLocalWhisperMessage,
  deleteDirectMessage as deleteLocalWhisperMessage,
  subscribeToDirectWhispers,
} from './whisperChatService';

export interface DirectConversation {
  id: string;
  partnerId: string;
  partnerProfile: Profile;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt?: string;
}

const memoryConversations = new Map<string, string>();

function getLocalConversationsKey(userId: string): string {
  return `hauntly_conversations_${userId.trim()}`;
}

function getStoredLocalConversations(userId: string): Array<{
  id: string;
  partnerId: string;
  partnerProfile?: Profile;
  lastMessage?: string;
  lastMessageAt: string;
}> {
  try {
    const key = getLocalConversationsKey(userId);
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(key);
    } else {
      raw = memoryConversations.get(key) || null;
    }
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local conversations', err);
  }
  return [];
}

function saveStoredLocalConversations(
  userId: string,
  conversations: Array<{
    id: string;
    partnerId: string;
    partnerProfile?: Profile;
    lastMessage?: string;
    lastMessageAt: string;
  }>
): void {
  try {
    const key = getLocalConversationsKey(userId);
    const serialized = JSON.stringify(conversations);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryConversations.set(key, serialized);
    }
  } catch (err) {
    console.warn('Failed to save local conversations', err);
  }
}

/**
 * Scans local storage for any existing direct whispers between current user and other users.
 * Automatically recovers conversations so no chat history is lost.
 */
function discoverWhisperConversationsFromStorage(currentUserId: string): string[] {
  const discoveredPartnerIds = new Set<string>();
  if (typeof localStorage === 'undefined') return [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith('hauntly_whisper_')) {
        const parts = storageKey.replace('hauntly_whisper_', '').split('_');
        if (parts.length >= 2) {
          // Check if current user is part of this whisper key
          if (parts[0] === currentUserId && parts[1]) {
            discoveredPartnerIds.add(parts[1]);
          } else if (parts[1] === currentUserId && parts[0]) {
            discoveredPartnerIds.add(parts[0]);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to scan whisper storage', err);
  }

  return Array.from(discoveredPartnerIds);
}

/**
 * Lists all 1-on-1 direct conversations for the given user.
 * Tries Supabase `conversations` table first, seamlessly falling back to local storage
 * and automatically joining the partner's profile.
 */
export async function listUserConversations(currentUserId: string): Promise<DirectConversation[]> {
  if (!currentUserId) return [];

  const conversationsMap = new Map<string, DirectConversation>();

  // 1. Try fetching from Supabase conversations table
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at,
          created_at
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const partnerId = row.user1_id === currentUserId ? row.user2_id : row.user1_id;
          if (!partnerId || partnerId === currentUserId) continue;

          // Fetch partner profile
          const { data: partnerProfile } = await getProfile(partnerId);
          if (partnerProfile) {
            conversationsMap.set(partnerId, {
              id: row.id,
              partnerId,
              partnerProfile,
              lastMessage: row.last_message || undefined,
              lastMessageAt: row.last_message_at || row.created_at || new Date().toISOString(),
              createdAt: row.created_at,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Supabase conversations query failed, using local store:', err);
    }
  }

  // 2. Merge with locally stored conversations
  const localList = getStoredLocalConversations(currentUserId);
  for (const item of localList) {
    if (!item.partnerId || item.partnerId === currentUserId) continue;
    if (!conversationsMap.has(item.partnerId)) {
      let partnerProfile = item.partnerProfile;
      if (!partnerProfile) {
        const { data: fetchedProfile } = await getProfile(item.partnerId);
        partnerProfile = fetchedProfile || undefined;
      }
      if (partnerProfile) {
        conversationsMap.set(item.partnerId, {
          id: item.id || getDirectChatKey(currentUserId, item.partnerId),
          partnerId: item.partnerId,
          partnerProfile,
          lastMessage: item.lastMessage,
          lastMessageAt: item.lastMessageAt || new Date().toISOString(),
        });
      }
    }
  }

  // 3. Discover any whisper chat threads stored in localStorage
  const discoveredPartners = discoverWhisperConversationsFromStorage(currentUserId);
  for (const pId of discoveredPartners) {
    if (!conversationsMap.has(pId)) {
      const msgs = await fetchLocalWhisperMessages(currentUserId, pId);
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      const { data: partnerProfile } = await getProfile(pId);
      if (partnerProfile) {
        conversationsMap.set(pId, {
          id: getDirectChatKey(currentUserId, pId),
          partnerId: pId,
          partnerProfile,
          lastMessage: lastMsg?.text || undefined,
          lastMessageAt: lastMsg ? new Date().toISOString() : new Date().toISOString(),
        });
      }
    }
  }

  const result = Array.from(conversationsMap.values());
  // Sort descending by last message timestamp
  result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  // Keep local storage synchronized
  saveStoredLocalConversations(
    currentUserId,
    result.map((c) => ({
      id: c.id,
      partnerId: c.partnerId,
      partnerProfile: c.partnerProfile,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
    }))
  );

  return result;
}

/**
 * Creates or retrieves a private 1-to-1 conversation with a partner.
 * Canonical ordering prevents duplicate conversations between the same two users.
 */
export async function getOrCreateConversation(params: {
  currentUserId: string;
  partnerId: string;
  partnerProfile?: Profile;
}): Promise<{ conversation: DirectConversation; error?: string }> {
  const { currentUserId, partnerId, partnerProfile: passedProfile } = params;

  if (!currentUserId || !partnerId) {
    return {
      conversation: null as unknown as DirectConversation,
      error: 'Invalid user IDs provided for conversation.',
    };
  }

  if (currentUserId === partnerId) {
    return {
      conversation: null as unknown as DirectConversation,
      error: 'Cannot create a conversation with yourself.',
    };
  }

  // Ensure partner profile is loaded
  let partnerProfile = passedProfile;
  if (!partnerProfile) {
    const { data } = await getProfile(partnerId);
    if (data) {
      partnerProfile = data;
    } else {
      partnerProfile = {
        id: partnerId,
        hauntly_id: `HAUNT-${partnerId.slice(0, 6).toUpperCase()}`,
        username: `spirit_${partnerId.slice(0, 6)}`,
        display_name: 'Mysterious Spirit',
        avatar_url: '/avatars/avatar_vampire.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  const canonicalKey = getDirectChatKey(currentUserId, partnerId);
  let conversationId = canonicalKey;
  let lastMessage: string | undefined;
  let lastMessageAt = new Date().toISOString();

  // Try Supabase conversations table
  if (isSupabaseConfigured) {
    try {
      const u1 = [currentUserId, partnerId].sort()[0];
      const u2 = [currentUserId, partnerId].sort()[1];

      // Check existing
      const { data: existing, error: selectErr } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`)
        .maybeSingle();

      if (!selectErr && existing) {
        conversationId = existing.id;
        lastMessage = existing.last_message || undefined;
        lastMessageAt = existing.last_message_at || existing.created_at;
      } else if (!existing) {
        // Create new conversation
        const { data: inserted, error: insertErr } = await supabase
          .from('conversations')
          .insert({
            user1_id: u1,
            user2_id: u2,
            last_message: null,
            last_message_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (!insertErr && inserted) {
          conversationId = inserted.id;
        }
      }
    } catch (err) {
      console.warn('Supabase conversation getOrCreate error:', err);
    }
  }

  const conv: DirectConversation = {
    id: conversationId,
    partnerId,
    partnerProfile,
    lastMessage,
    lastMessageAt,
  };

  // Update local storage for immediate persistence
  const localList = getStoredLocalConversations(currentUserId);
  const existingIdx = localList.findIndex((c) => c.partnerId === partnerId);
  if (existingIdx >= 0) {
    localList[existingIdx] = {
      id: conv.id,
      partnerId: conv.partnerId,
      partnerProfile: conv.partnerProfile,
      lastMessage: conv.lastMessage || localList[existingIdx].lastMessage,
      lastMessageAt: conv.lastMessageAt || localList[existingIdx].lastMessageAt,
    };
  } else {
    localList.unshift({
      id: conv.id,
      partnerId: conv.partnerId,
      partnerProfile: conv.partnerProfile,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
    });
  }
  saveStoredLocalConversations(currentUserId, localList);

  // Notify listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hauntly_conversations_updated', {
        detail: { conversation: conv },
      })
    );
  }

  return { conversation: conv };
}

/**
 * Loads messages for a conversation between two users.
 * Supports Supabase direct_messages table and falls back to whisper storage.
 */
export async function fetchConversationMessages(
  userId1: string,
  userId2: string
): Promise<ChatMessage[]> {
  // 1. Check local / whisper storage first for fast response
  const localMsgs = await fetchLocalWhisperMessages(userId1, userId2);

  // 2. Check Supabase direct_messages table if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          sender:fk_direct_messages_sender_profile(display_name)
        `)
        .or(
          `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Map to ChatMessage format
        const remoteMsgs: ChatMessage[] = data.map((d) => ({
          id: d.id,
          senderId: d.sender_id,
          senderName: (d.sender as unknown as { display_name?: string })?.display_name || 'Spirit',
          receiverId: d.receiver_id,
          text: d.content,
          time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        // Merge remote and local without duplicates
        const map = new Map<string, ChatMessage>();
        for (const m of localMsgs) map.set(m.id, m);
        for (const m of remoteMsgs) map.set(m.id, m);

        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('Supabase direct_messages fetch error, using local whisper store:', err);
    }
  }

  return localMsgs;
}

/**
 * Sends a direct message to a user.
 * Dispatches real-time broadcast, saves locally, and records to Supabase.
 */
export async function sendDirectWhisper(params: {
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  partnerProfile?: Profile;
}): Promise<ChatMessage> {
  const { senderId, senderName, receiverId, text, partnerProfile } = params;

  if (senderId === receiverId) {
    throw new Error('You cannot whisper to yourself.');
  }

  // 1. Send via whisper service (handles local storage and Realtime broadcast)
  const chatMsg = await sendLocalWhisperMessage({
    senderId,
    senderName,
    receiverId,
    text,
  });

  // 2. Ensure conversation is tracked in list
  await getOrCreateConversation({
    currentUserId: senderId,
    partnerId: receiverId,
    partnerProfile,
  });

  // 3. Update local conversation lastMessage for both sender and receiver
  const nowIso = new Date().toISOString();

  // For sender:
  const senderList = getStoredLocalConversations(senderId);
  const foundSenderIdx = senderList.findIndex((c) => c.partnerId === receiverId);
  if (foundSenderIdx >= 0) {
    senderList[foundSenderIdx].lastMessage = text;
    senderList[foundSenderIdx].lastMessageAt = nowIso;
    saveStoredLocalConversations(senderId, senderList);
  }

  // For receiver:
  const receiverList = getStoredLocalConversations(receiverId);
  const foundReceiverIdx = receiverList.findIndex((c) => c.partnerId === senderId);
  if (foundReceiverIdx >= 0) {
    receiverList[foundReceiverIdx].lastMessage = text;
    receiverList[foundReceiverIdx].lastMessageAt = nowIso;
    saveStoredLocalConversations(receiverId, receiverList);
  } else {
    receiverList.unshift({
      id: getDirectChatKey(senderId, receiverId),
      partnerId: senderId,
      partnerProfile,
      lastMessage: text,
      lastMessageAt: nowIso,
    });
    saveStoredLocalConversations(receiverId, receiverList);
  }

  // 4. Record to Supabase direct_messages if configured
  if (isSupabaseConfigured) {
    try {
      // Find or get conversation UUID
      const u1 = [senderId, receiverId].sort()[0];
      const u2 = [senderId, receiverId].sort()[1];
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`)
        .maybeSingle();

      if (conv?.id) {
        await supabase.from('direct_messages').insert({
          conversation_id: conv.id,
          sender_id: senderId,
          receiver_id: receiverId,
          content: text.trim(),
        });
      }
    } catch (err) {
      console.warn('Supabase direct_messages insert error:', err);
    }
  }

  // Notify UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hauntly_conversations_updated', {
        detail: { partnerId: receiverId, lastMessage: text },
      })
    );
  }

  return chatMsg;
}

/**
 * Deletes a direct whisper message (sender only).
 */
export async function deleteDirectWhisper(params: {
  messageId: string;
  userId1: string;
  userId2: string;
  currentUserId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { messageId, userId1, userId2, currentUserId } = params;

  // Delete locally
  const res = await deleteLocalWhisperMessage({
    messageId,
    userId1,
    userId2,
    currentUserId,
  });

  if (!res.success) return res;

  // Delete from Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUserId);
    } catch (err) {
      console.warn('Supabase direct_messages delete error:', err);
    }
  }

  return { success: true };
}

/**
 * Subscribes to real-time direct whispers between two users.
 */
export function subscribeToDirectMessages(params: {
  userId1: string;
  userId2: string;
  onNewMessage: (msg: ChatMessage) => void;
  onDeleteMessage: (messageId: string) => void;
}): () => void {
  return subscribeToDirectWhispers(params);
}
