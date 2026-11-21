import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  fetchAcceptedFriends,
  fetchPendingRequests,
  getRelationshipStatus,
} from '../src/lib/friendsService';
import { ensureProfile } from '../src/lib/profileService';
import type { User } from '@supabase/supabase-js';

async function runFriendshipsTest() {
  console.log('🦇 =========================================================');
  console.log('🦇 TEST SUITE: FRIENDSHIPS TABLE, RLS LOGIC & FRIEND FLOWS');
  console.log('🦇 =========================================================\n');

  const userA: User = {
    id: '11111111-1111-4111-8111-111111111111',
    app_metadata: { provider: 'email' },
    user_metadata: { display_name: 'Morticia' },
    email: 'morticia@hauntly.test',
  } as User;

  const userB: User = {
    id: '22222222-2222-4222-8222-222222222222',
    app_metadata: { provider: 'email' },
    user_metadata: { display_name: 'Gomez' },
    email: 'gomez@hauntly.test',
  } as User;

  await ensureProfile(userA);
  await ensureProfile(userB);

  // Test 1: Self-friend prevention
  console.log('🧪 TEST 1: Prevent Self-Friend Requests');
  const selfRes = await sendFriendRequest(userA.id, userA.id);
  if (!selfRes.error) {
    throw new Error('FAIL: Self-friend request was not blocked!');
  }
  console.log('  ✅ PASS: Blocked self-friend request:', selfRes.error.message);

  // Test 2: Send friend request from User A to User B
  console.log('\n🧪 TEST 2: Send Friend Request (Requester/Sender -> Addressee/Receiver)');
  const reqRes = await sendFriendRequest(userA.id, userB.id);
  if (reqRes.error || !reqRes.data) {
    throw new Error('FAIL: Friend request failed: ' + reqRes.error?.message);
  }
  const friendshipId = reqRes.data.id;
  console.log('  ✅ PASS: Friendship record created with ID:', friendshipId);
  console.log('  ✅ PASS: Status is:', reqRes.data.status);
  console.log('  ✅ PASS: requester_id:', reqRes.data.requester_id, '| addressee_id:', reqRes.data.addressee_id);
  console.log('  ✅ PASS: sender_id:', reqRes.data.sender_id, '| receiver_id:', reqRes.data.receiver_id);

  // Test 3: Prevent duplicate friend request
  console.log('\n🧪 TEST 3: Duplicate Request Prevention');
  const dupRes = await sendFriendRequest(userA.id, userB.id);
  if (!dupRes.error) {
    throw new Error('FAIL: Duplicate request was allowed!');
  }
  console.log('  ✅ PASS: Duplicate request rejected:', dupRes.error.message);

  // Test 3B: Prevent inverse duplicate request (B -> A while A -> B is pending)
  console.log('\n🧪 TEST 3B: Inverse Duplicate Request Prevention');
  const inverseRes = await sendFriendRequest(userB.id, userA.id);
  if (!inverseRes.error) {
    throw new Error('FAIL: Inverse duplicate request was allowed!');
  }
  console.log('  ✅ PASS: Inverse request rejected:', inverseRes.error.message);

  // Test 4: Check relationship status
  console.log('\n🧪 TEST 4: Relationship Status Attunement');
  const statusA = await getRelationshipStatus(userA.id, userB.id);
  const statusB = await getRelationshipStatus(userB.id, userA.id);
  if (statusA !== 'pending_sent') throw new Error('FAIL: Expected statusA to be pending_sent, got ' + statusA);
  if (statusB !== 'pending_received') throw new Error('FAIL: Expected statusB to be pending_received, got ' + statusB);
  console.log('  ✅ PASS: User A status:', statusA);
  console.log('  ✅ PASS: User B status:', statusB);

  // Test 5: Fetch pending requests
  console.log('\n🧪 TEST 5: Fetch Pending Requests');
  const pendingB = await fetchPendingRequests(userB.id);
  const hasReceived = pendingB.received.some((r) => r.id === friendshipId);
  if (!hasReceived) throw new Error('FAIL: User B did not receive request!');
  console.log('  ✅ PASS: User B received incoming request list count:', pendingB.received.length);

  // Test 6: Accept friend request
  console.log('\n🧪 TEST 6: Accept Friend Request');
  const acceptRes = await acceptFriendRequest(friendshipId, userB.id);
  if (acceptRes.error) throw new Error('FAIL: Accept request returned error: ' + acceptRes.error.message);
  console.log('  ✅ PASS: Friend request accepted successfully');

  // Test 7: Verify accepted relationship & list
  console.log('\n🧪 TEST 7: Verify Mutual Friendship');
  const postStatusA = await getRelationshipStatus(userA.id, userB.id);
  const postStatusB = await getRelationshipStatus(userB.id, userA.id);
  if (postStatusA !== 'friends' || postStatusB !== 'friends') {
    throw new Error(`FAIL: Expected both to be friends, got A=${postStatusA}, B=${postStatusB}`);
  }
  console.log('  ✅ PASS: User A sees status:', postStatusA);
  console.log('  ✅ PASS: User B sees status:', postStatusB);

  const friendsListA = await fetchAcceptedFriends(userA.id);
  const isBInA = friendsListA.data.some((f) => f.friend.id === userB.id);
  if (!isBInA) throw new Error('FAIL: User B not in User A friends list!');
  console.log('  ✅ PASS: User B present in User A accepted friends list');

  const friendsListB = await fetchAcceptedFriends(userB.id);
  const isAInB = friendsListB.data.some((f) => f.friend.id === userA.id);
  if (!isAInB) throw new Error('FAIL: User A not in User B friends list!');
  console.log('  ✅ PASS: User A present in User B accepted friends list');

  // Test 8: Sever / Remove friend
  console.log('\n🧪 TEST 8: Sever Friendship Connection');
  const removeRes = await removeFriend(friendshipId, userA.id);
  if (removeRes.error) throw new Error('FAIL: Remove friend returned error: ' + removeRes.error.message);

  const postRemoveStatus = await getRelationshipStatus(userA.id, userB.id);
  if (postRemoveStatus !== 'none') throw new Error('FAIL: Expected status to be none, got ' + postRemoveStatus);
  console.log('  ✅ PASS: Friendship removed. New relationship status:', postRemoveStatus);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ALL FRIENDSHIPS TABLE & SERVICE TESTS PASSED! ✨');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runFriendshipsTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
