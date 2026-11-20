import type { Profile } from './profile';

export type GroupRole = 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  unread_count?: number;
  last_message?: {
    id: string;
    content: string;
    sender_name: string;
    created_at: string;
  } | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  last_read_at: string;
  profile?: Profile;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
  userReacted: boolean;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  reactions: ReactionSummary[];
  message_type?: 'text' | 'audio' | 'file' | 'location_suggestion';
  audio_duration?: string;
  file_name?: string;
  file_size?: string;
  location_data?: {
    location_id: string;
    name: string;
    address: string;
    description?: string;
    latitude: number;
    longitude: number;
    category?: string;
  };
}

export interface MessageReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface TypingUser {
  userId: string;
  displayName: string;
  timestamp: number;
}

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';
