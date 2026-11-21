import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

// BroadcastChannel for cross-tab communication in multi-user/local testing
let whisperBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    whisperBroadcastChannel = new BroadcastChannel('hauntly_direct_whispers');
  }
} catch {
  // BroadcastChannel unavailable
}

const memoryStore = new Map<string, string>();

/**
 * Computes a canonical, symmetric conversation key between two users.
 * Example: ['usr_alex', 'usr_sarah'].sort() => 'hauntly_whisper_usr_alex_usr_sarah'
 * Both User A and User B share the exact same key regardless of who initiates.
 */
export function getDirectChatKey(userId1: string, userId2: string): string {
  const sorted = [userId1.trim(), userId2.trim()].sort();
  return `hauntly_whisper_${sorted[0]}_${sorted[1]}`;
}

/**
 * Loads messages for a 1-on-1 direct whisper between two user IDs.
 */
export async function fetchDirectMessages(
  userId1: string,
  userId2: string
): Promise<ChatMessage[]> {
  const key = getDirectChatKey(userId1, userId2);
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } else {
      const mem = memoryStore.get(key);
      if (mem) return JSON.parse(mem);
    }
  } catch (err) {
    console.warn('Failed to load direct messages', err);
  }
  return [];
}

/**
 * Sends a direct whisper message from one user ID to another.
 * Persists to storage and broadcasts across live channels (cross-tab and Supabase Realtime).
 */
export async function sendDirectMessage(params: {
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
}): Promise<ChatMessage> {
  const { senderId, senderName, receiverId, text } = params;
  const key = getDirectChatKey(senderId, receiverId);

  const newMsg: ChatMessage = {
    id: `whisper_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderId,
    senderName,
    receiverId,
    text: text.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const existing = await fetchDirectMessages(senderId, receiverId);
  const updated = [...existing, newMsg];

  try {
    const serialized = JSON.stringify(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (err) {
    console.warn('Failed to save whisper message', err);
  }

  // 1. Broadcast locally (cross-tab / multi-user in browser)
  whisperBroadcastChannel?.postMessage({
    type: 'new_whisper',
    chatKey: key,
    message: newMsg,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hauntly_whisper_sent', {
        detail: { chatKey: key, message: newMsg },
      })
    );
  }

  // 2. Broadcast via Supabase Realtime channel if cloud is active
  if (isSupabaseConfigured) {
    try {
      const liveChannel = supabase.channel(`whisper_channel:${key}`);
      await liveChannel.send({
        type: 'broadcast',
        event: 'new_whisper',
        payload: { message: newMsg },
      });
    } catch (err) {
      console.warn('Supabase whisper broadcast error', err);
    }
  }

  return newMsg;
}

/**
 * Deletes a direct whisper message.
 * Enforces ownership: only the sender may delete their own message.
 */
export async function deleteDirectMessage(params: {
  messageId: string;
  userId1: string;
  userId2: string;
  currentUserId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { messageId, userId1, userId2, currentUserId } = params;
  const key = getDirectChatKey(userId1, userId2);
  const existing = await fetchDirectMessages(userId1, userId2);

  const target = existing.find((m) => m.id === messageId);
  if (!target) {
    return { success: false, error: 'Message not found.' };
  }

  if (target.senderId !== currentUserId) {
    return { success: false, error: 'You can only delete your own messages.' };
  }

  const updated = existing.filter((m) => m.id !== messageId);
  try {
    const serialized = JSON.stringify(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (err) {
    console.warn('Failed to persist message deletion', err);
  }

  whisperBroadcastChannel?.postMessage({
    type: 'delete_whisper',
    chatKey: key,
    messageId,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hauntly_whisper_deleted', {
        detail: { chatKey: key, messageId },
      })
    );
  }

  if (isSupabaseConfigured) {
    try {
      const liveChannel = supabase.channel(`whisper_channel:${key}`);
      await liveChannel.send({
        type: 'broadcast',
        event: 'delete_whisper',
        payload: { messageId },
      });
    } catch (err) {
      console.warn('Supabase whisper delete broadcast error', err);
    }
  }

  return { success: true };
}

/**
 * Subscribes to direct whisper updates for two users.
 * Delivers incoming messages and message deletions in real time.
 */
export function subscribeToDirectWhispers(params: {
  userId1: string;
  userId2: string;
  onNewMessage: (msg: ChatMessage) => void;
  onDeleteMessage: (messageId: string) => void;
}): () => void {
  const { userId1, userId2, onNewMessage, onDeleteMessage } = params;
  const key = getDirectChatKey(userId1, userId2);

  // Cross-tab broadcast listener
  const handleBroadcast = (evt: MessageEvent) => {
    const data = evt.data;
    if (!data || data.chatKey !== key) return;

    if (data.type === 'new_whisper' && data.message) {
      onNewMessage(data.message);
    } else if (data.type === 'delete_whisper' && data.messageId) {
      onDeleteMessage(data.messageId);
    }
  };

  whisperBroadcastChannel?.addEventListener('message', handleBroadcast);

  // In-window custom event listener
  const handleWindowNew = (evt: Event) => {
    const custom = evt as CustomEvent;
    if (custom.detail?.chatKey === key && custom.detail?.message) {
      onNewMessage(custom.detail.message);
    }
  };

  const handleWindowDelete = (evt: Event) => {
    const custom = evt as CustomEvent;
    if (custom.detail?.chatKey === key && custom.detail?.messageId) {
      onDeleteMessage(custom.detail.messageId);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('hauntly_whisper_sent', handleWindowNew);
    window.addEventListener('hauntly_whisper_deleted', handleWindowDelete);
  }

  // Supabase Realtime Channel
  let channel: RealtimeChannel | null = null;
  if (isSupabaseConfigured) {
    try {
      channel = supabase.channel(`whisper_channel:${key}`);
      channel
        .on('broadcast', { event: 'new_whisper' }, (payload) => {
          if (payload.payload?.message) {
            onNewMessage(payload.payload.message);
          }
        })
        .on('broadcast', { event: 'delete_whisper' }, (payload) => {
          if (payload.payload?.messageId) {
            onDeleteMessage(payload.payload.messageId);
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase whisper subscription error', err);
    }
  }

  return () => {
    whisperBroadcastChannel?.removeEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.removeEventListener('hauntly_whisper_sent', handleWindowNew);
      window.removeEventListener('hauntly_whisper_deleted', handleWindowDelete);
    }
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
}
