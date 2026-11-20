export interface Profile {
  id: string;
  hauntly_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_selection?: string;
  status?: string;
  bio?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at?: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface BlockRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: Profile;
}

export interface FriendEntry {
  friendshipId: string;
  friend: Profile;
  status: FriendshipStatus;
  isRequester: boolean;
  createdAt: string;
}

export type RelationshipStatus =
  | 'self'
  | 'none'
  | 'friends'
  | 'pending_sent'
  | 'pending_received'
  | 'blocked';
