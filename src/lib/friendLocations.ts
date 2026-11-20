import type { FriendPin } from '../types/globe';
import type { Profile, Friendship } from '../types/profile';

/**
 * Global companion friend positions matching the Hauntly 3D Earth artwork
 * These represent online friends actively haunting various locations worldwide.
 */
export const GLOBAL_ONLINE_FRIENDS: FriendPin[] = [
  {
    id: 'fpin_sabrina',
    user_id: 'usr_sabrina',
    name: 'Sabrina',
    handle: 'sabrina',
    avatar_url: '/chat/avatar_sabrina.png',
    city: 'Salem, Massachusetts',
    country: 'USA',
    latitude: 42.5211,
    longitude: -70.8985,
    status: 'online',
    activity: 'Brewing potions at Corwin Estate',
  },
  {
    id: 'fpin_saman',
    user_id: 'usr_saman',
    name: 'Saman Shafaei',
    handle: 'saman',
    avatar_url: '/chat/avatar_saman.png',
    city: 'Lima & Andes',
    country: 'Peru',
    latitude: -12.0464,
    longitude: -77.0428,
    status: 'online',
    activity: 'Surveying ancient nocturnal ruins',
  },
  {
    id: 'fpin_sasha',
    user_id: 'usr_sasha',
    name: 'Sasha',
    handle: 'sasha',
    avatar_url: '/chat/avatar_sasha.png',
    city: 'Transylvania',
    country: 'Romania',
    latitude: 45.5152,
    longitude: 25.3672,
    status: 'online',
    activity: 'Walking the ramparts of Bran Castle',
  },
  {
    id: 'fpin_austin',
    user_id: 'usr_austin',
    name: 'Austin',
    handle: 'austin',
    avatar_url: '/chat/avatar_austin.png',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5081,
    longitude: -0.0759,
    status: 'online',
    activity: 'Whispering to the ravens at Tower of London',
  },
  {
    id: 'fpin_vanessa',
    user_id: 'usr_vanessa',
    name: 'Vanessa',
    handle: 'vanessa',
    avatar_url: '/chat/avatar_vanessa.png',
    city: 'Yamanashi & Fuji',
    country: 'Japan',
    latitude: 35.4745,
    longitude: 138.6496,
    status: 'online',
    activity: 'Meditating under nocturnal sea of trees',
  },
  {
    id: 'fpin_arthur',
    user_id: 'usr_arthur',
    name: 'Arthur',
    handle: 'arthur',
    avatar_url: '/chat/avatar_arthur.png',
    city: 'Rajasthan',
    country: 'India',
    latitude: 27.0964,
    longitude: 76.2862,
    status: 'online',
    activity: 'Deciphering curses at Bhangarh Fort',
  },
];

/**
 * Loads dynamic pinpoint locations for friends who have set their location in Settings.
 */
export async function getLiveFriendPins(currentUserId?: string): Promise<FriendPin[]> {
  const pins: FriendPin[] = [];
  const processedUserIds = new Set<string>();

  try {
    if (typeof localStorage !== 'undefined') {
      const rawProfiles = localStorage.getItem('hauntly_local_profiles');
      const profilesMap: Record<string, Profile> = rawProfiles ? JSON.parse(rawProfiles) : {};

      const rawFriendships = localStorage.getItem('hauntly_local_friendships');
      const friendships: Friendship[] = rawFriendships ? JSON.parse(rawFriendships) : [];

      // 1. Current user pin if set
      if (currentUserId && profilesMap[currentUserId]) {
        const selfProfile = profilesMap[currentUserId];
        if (
          typeof selfProfile.latitude === 'number' &&
          typeof selfProfile.longitude === 'number' &&
          !isNaN(selfProfile.latitude) &&
          !isNaN(selfProfile.longitude)
        ) {
          pins.push({
            id: `fpin_self_${selfProfile.id}`,
            user_id: selfProfile.id,
            name: `${selfProfile.display_name} (You)`,
            handle: selfProfile.username || 'you',
            avatar_url: selfProfile.avatar_url || '/avatars/avatar_vampire.jpg',
            city: selfProfile.location_name || 'Sanctum Coordinates',
            country: 'Earth',
            latitude: selfProfile.latitude,
            longitude: selfProfile.longitude,
            status: 'online',
            activity: 'Your Active Sanctuary on Earth',
            isSelf: true,
          });
          processedUserIds.add(selfProfile.id);
        }
      }

      // 2. Accepted friends who set their locations
      if (currentUserId) {
        const acceptedFriendships = friendships.filter(
          (f) =>
            f.status === 'accepted' &&
            (f.requester_id === currentUserId || f.addressee_id === currentUserId)
        );

        for (const f of acceptedFriendships) {
          const friendId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id;
          if (processedUserIds.has(friendId)) continue;

          const friendProfile = profilesMap[friendId];
          if (
            friendProfile &&
            typeof friendProfile.latitude === 'number' &&
            typeof friendProfile.longitude === 'number' &&
            !isNaN(friendProfile.latitude) &&
            !isNaN(friendProfile.longitude)
          ) {
            pins.push({
              id: `fpin_${friendProfile.id}`,
              user_id: friendProfile.id,
              name: friendProfile.display_name,
              handle: friendProfile.username,
              avatar_url: friendProfile.avatar_url || '/hauntly-icon.png',
              city: friendProfile.location_name || 'Spirit Sanctuary',
              country: '',
              latitude: friendProfile.latitude,
              longitude: friendProfile.longitude,
              status: 'online',
              activity: friendProfile.bio || 'Haunting the nocturnal realm',
            });
            processedUserIds.add(friendId);
          }
        }
      }

      // 3. Any other profile in local storage that has explicitly set a location (e.g. companions or multi-account testing)
      for (const [uid, prof] of Object.entries(profilesMap)) {
        if (processedUserIds.has(uid) || uid === currentUserId) continue;
        if (
          typeof prof.latitude === 'number' &&
          typeof prof.longitude === 'number' &&
          !isNaN(prof.latitude) &&
          !isNaN(prof.longitude)
        ) {
          pins.push({
            id: `fpin_${prof.id}`,
            user_id: prof.id,
            name: prof.display_name,
            handle: prof.username,
            avatar_url: prof.avatar_url || '/hauntly-icon.png',
            city: prof.location_name || 'Spirit Sanctuary',
            country: '',
            latitude: prof.latitude,
            longitude: prof.longitude,
            status: 'online',
            activity: prof.bio || 'Exploring global sanctuaries',
          });
          processedUserIds.add(uid);
        }
      }
    }
  } catch (e) {
    console.warn('Error reading live friend pins from local storage:', e);
  }

  // 4. Fill in companion friends from GLOBAL_ONLINE_FRIENDS for any not yet overridden
  for (const companion of GLOBAL_ONLINE_FRIENDS) {
    if (!processedUserIds.has(companion.user_id)) {
      pins.push(companion);
      processedUserIds.add(companion.user_id);
    }
  }

  return pins;
}

/**
 * Subscribes to live friend pin changes across tabs and local updates
 */
export function subscribeToLiveFriendPins(
  currentUserId: string | undefined,
  callback: (pins: FriendPin[]) => void
): () => void {
  let active = true;

  const refresh = async () => {
    const pins = await getLiveFriendPins(currentUserId);
    if (active) {
      callback(pins);
    }
  };

  void refresh();

  if (typeof window !== 'undefined') {
    const handleUpdate = () => void refresh();
    window.addEventListener('hauntly_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      active = false;
      window.removeEventListener('hauntly_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }

  return () => {
    active = false;
  };
}
