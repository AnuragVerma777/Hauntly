import type { Profile } from './profile';

export type LocationCategory =
  | 'sanctuary'
  | 'crypt'
  | 'coven_hall'
  | 'historic'
  | 'observatory'
  | 'gathering';

export interface GroupLocation {
  id: string;
  group_id: string;
  name: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  suggested_by: string;
  category: LocationCategory;
  is_selected?: boolean;
  selected_by?: string;
  selected_at?: string;
  vote_count?: number;
  leading_location?: boolean;
  created_at: string;
  updated_at?: string;
  suggested_by_profile?: Profile;
}

export interface GroupLocationInsert {
  group_id: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  suggested_by: string;
  category?: LocationCategory;
  is_selected?: boolean;
}

export interface LocationVote {
  id: string;
  location_id: string;
  group_id?: string;
  user_id: string;
  created_at: string;
}

export interface LocationWithVotes extends GroupLocation {
  vote_count: number;
  voted_by_current_user: boolean;
  voter_ids: string[];
  is_selected: boolean;
}

export interface FriendPin {
  id: string;
  user_id: string;
  name: string;
  handle: string;
  avatar_url: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'spectral';
  activity?: string;
  isSelf?: boolean;
}

export type GlobeViewMode = 'globe' | 'list';

export interface MapStyleOption {
  id: string;
  name: string;
  description: string;
  url?: string;
}
