/**
 * Automated test suite for Setting Location from Settings & Pinpointing Friend's Location on Globe
 */
import { updateProfile, getProfile } from '../src/lib/profileService';
import { getLiveFriendPins } from '../src/lib/friendLocations';

async function runTest() {
  console.log('\n👻 =========================================================');
  console.log('👻 TEST SUITE: SET LOCATION IN SETTINGS & GLOBE PINPOINTING');
  console.log('👻 =========================================================\n');

  // Simulated User A (Current User) & User B (Friend)
  const userAId = 'usr_test_coven_leader';
  const userBId = 'usr_test_friend_wanderer';

  // Seed profiles in local memory
  const now = new Date().toISOString();
  const profilesMap: Record<string, any> = {
    [userAId]: {
      id: userAId,
      hauntly_id: 'HAUNT-COVEN1',
      username: 'coven_leader',
      display_name: 'Coven Leader',
      avatar_url: '/avatar_witch_pumpkin.png',
      status: 'active',
      bio: 'Leading the nocturnal coven',
      created_at: now,
      updated_at: now,
    },
    [userBId]: {
      id: userBId,
      hauntly_id: 'HAUNT-FRND2',
      username: 'wanderer_ghost',
      display_name: 'Wandering Ghost',
      avatar_url: '/avatar_cute_ghost.png',
      status: 'active',
      bio: 'Wandering across earthly sanctuaries',
      created_at: now,
      updated_at: now,
    },
  };

  const friendships = [
    {
      id: 'fship_test_1',
      requester_id: userAId,
      addressee_id: userBId,
      status: 'accepted',
      created_at: now,
      updated_at: now,
    },
  ];

  // Set in localStorage mock
  (globalThis as any).localStorage = {
    _data: {
      hauntly_local_profiles: JSON.stringify(profilesMap),
      hauntly_local_friendships: JSON.stringify(friendships),
    },
    getItem(k: string) {
      return this._data[k] || null;
    },
    setItem(k: string, v: string) {
      this._data[k] = v;
    },
    removeItem(k: string) {
      delete this._data[k];
    },
  };

  // Test 1: Set Location for User A (Salem, Massachusetts)
  console.log('📍 Test 1: User A sets location from Settings...');
  const resA = await updateProfile(userAId, {
    location_name: 'Salem, Massachusetts, USA',
    latitude: 42.5211,
    longitude: -70.8985,
  });

  if (resA.error) {
    throw new Error('User A location update failed: ' + resA.error.message);
  }
  console.log('   ✓ User A profile updated:');
  console.log(`     Location: ${resA.data?.location_name}`);
  console.log(`     Coordinates: (${resA.data?.latitude}, ${resA.data?.longitude})`);

  // Test 2: Set Location for Friend User B (Tokyo, Japan)
  console.log('\n📍 Test 2: Friend User B sets location from Settings...');
  const resB = await updateProfile(userBId, {
    location_name: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
  });

  if (resB.error) {
    throw new Error('User B location update failed: ' + resB.error.message);
  }
  console.log('   ✓ User B profile updated:');
  console.log(`     Location: ${resB.data?.location_name}`);
  console.log(`     Coordinates: (${resB.data?.latitude}, ${resB.data?.longitude})`);

  // Test 3: Globe dynamically queries live friend pins
  console.log('\n🌍 Test 3: 3D Earth Globe fetches live pinpointed friend pins for User A...');
  const pins = await getLiveFriendPins(userAId);

  console.log(`   ✓ Total friend pins on globe: ${pins.length}`);

  // Find User B (Friend) on the globe
  const friendBPin = pins.find((p) => p.user_id === userBId);
  if (!friendBPin) {
    throw new Error('Friend User B pin not found on globe!');
  }

  console.log('   ✓ Found Friend Pin for User B on 3D Earth:');
  console.log(`     Name: ${friendBPin.name}`);
  console.log(`     City/Sanctuary: ${friendBPin.city}`);
  console.log(`     Latitude: ${friendBPin.latitude}°`);
  console.log(`     Longitude: ${friendBPin.longitude}°`);

  if (friendBPin.latitude !== 35.6762 || friendBPin.longitude !== 139.6503) {
    throw new Error('Friend coordinates do not match exact pinpointed location!');
  }
  console.log('   ✓ Coordinates accurately pinpointed on the 3D globe!');

  // Test 4: User A (Self) also appears on the globe with isSelf: true
  console.log('\n👤 Test 4: Verifying User A own location is pinpointed with isSelf: true...');
  const selfPin = pins.find((p) => p.user_id === userAId);
  if (!selfPin || !selfPin.isSelf) {
    throw new Error('User A self pin not found or missing isSelf flag!');
  }
  console.log(`   ✓ Found User A Self Pin: ${selfPin.name} at (${selfPin.latitude}, ${selfPin.longitude})`);

  // Test 5: Friend updates location (e.g. moves to Paris, France)
  console.log('\n🔄 Test 5: Friend updates location to Paris, France from Settings...');
  await updateProfile(userBId, {
    location_name: 'Paris, France',
    latitude: 48.8566,
    longitude: 2.3522,
  });

  const updatedPins = await getLiveFriendPins(userAId);
  const updatedFriendBPin = updatedPins.find((p) => p.user_id === userBId);

  if (!updatedFriendBPin) {
    throw new Error('Updated Friend pin not found!');
  }
  if (updatedFriendBPin.latitude !== 48.8566 || updatedFriendBPin.longitude !== 2.3522) {
    throw new Error('Updated friend coordinates did not sync!');
  }
  console.log('   ✓ Real-time location shift verified:');
  console.log(`     New Location: ${updatedFriendBPin.city}`);
  console.log(`     New Coordinates: (${updatedFriendBPin.latitude}°, ${updatedFriendBPin.longitude}°)`);

  console.log('\n🎉 =========================================================');
  console.log('🎉 ALL 5 TESTS PASSED: FRIEND LOCATION PINPOINTING VERIFIED!');
  console.log('🎉 =========================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
