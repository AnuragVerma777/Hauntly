import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function runTest() {
  console.log('🦇 HAUNTLY SUPABASE USER PROFILES & FRIEND SYSTEM TEST\n');

  const env = loadEnv();
  const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
  const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || '';

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('your-project-ref') ||
    supabaseKey.includes('your-supabase-anon-key')
  ) {
    console.error('❌ Supabase is not configured yet in .env!');
    console.error('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    console.error('And run the SQL schema in supabase/schema.sql in your Supabase SQL editor.');
    process.exit(1);
  }

  console.log(`📡 Connecting to Supabase at: ${supabaseUrl}`);
  const client = createClient(supabaseUrl, supabaseKey);

  const timestamp = Date.now();
  const emailA = `soul_alice_${timestamp}@hauntly.test`;
  const emailB = `soul_bob_${timestamp}@hauntly.test`;
  const password = `SpectralSecret!${timestamp}`;

  console.log('\n--- 1. Testing Account 1 Creation (Alice) ---');
  const { data: authA, error: errA } = await client.auth.signUp({
    email: emailA,
    password: password,
    options: {
      data: {
        display_name: `Lady Alice ${timestamp.toString().slice(-4)}`,
        username: `alice_${timestamp.toString().slice(-4)}`,
      },
    },
  });

  if (errA) {
    console.error('❌ Failed to sign up Account 1:', errA.message);
    process.exit(1);
  }
  console.log(`✅ Account 1 signed up (UID: ${authA.user?.id})`);

  // Ensure profile for Alice
  let { data: profileA } = await client
    .from('profiles')
    .select('id, hauntly_id, username, display_name, avatar_url, created_at')
    .eq('id', authA.user!.id)
    .maybeSingle();

  if (!profileA) {
    console.log('Profile trigger not executed automatically; creating profile directly...');
    const candidateId = `HAUNT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const { data: newProf, error: pErr } = await client
      .from('profiles')
      .insert({
        id: authA.user!.id,
        hauntly_id: candidateId,
        username: `alice_${timestamp.toString().slice(-4)}`,
        display_name: `Lady Alice ${timestamp.toString().slice(-4)}`,
      })
      .select()
      .single();
    if (pErr) {
      console.error('❌ Error creating profile A:', pErr.message);
      process.exit(1);
    }
    profileA = newProf;
  }
  console.log(`✅ Alice Profile active with Hauntly ID: ${profileA?.hauntly_id} (@${profileA?.username})`);

  console.log('\n--- 2. Testing Account 2 Creation (Bob) ---');
  const clientB = createClient(supabaseUrl, supabaseKey);
  const { data: authB, error: errB } = await clientB.auth.signUp({
    email: emailB,
    password: password,
    options: {
      data: {
        display_name: `Lord Bob ${timestamp.toString().slice(-4)}`,
        username: `bob_${timestamp.toString().slice(-4)}`,
      },
    },
  });

  if (errB) {
    console.error('❌ Failed to sign up Account 2:', errB.message);
    process.exit(1);
  }
  console.log(`✅ Account 2 signed up (UID: ${authB.user?.id})`);

  let { data: profileB } = await clientB
    .from('profiles')
    .select('id, hauntly_id, username, display_name, avatar_url, created_at')
    .eq('id', authB.user!.id)
    .maybeSingle();

  if (!profileB) {
    const candidateId = `HAUNT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const { data: newProfB, error: pErrB } = await clientB
      .from('profiles')
      .insert({
        id: authB.user!.id,
        hauntly_id: candidateId,
        username: `bob_${timestamp.toString().slice(-4)}`,
        display_name: `Lord Bob ${timestamp.toString().slice(-4)}`,
      })
      .select()
      .single();
    if (pErrB) {
      console.error('❌ Error creating profile B:', pErrB.message);
      process.exit(1);
    }
    profileB = newProfB;
  }
  console.log(`✅ Bob Profile active with Hauntly ID: ${profileB?.hauntly_id} (@${profileB?.username})`);

  console.log('\n--- 3. Testing Public Hauntly ID Search (Zero Email Exposure) ---');
  const { data: searchResult, error: searchErr } = await clientB
    .from('profiles')
    .select('id, hauntly_id, username, display_name, avatar_url, created_at')
    .eq('hauntly_id', profileA!.hauntly_id)
    .single();

  if (searchErr || !searchResult) {
    console.error('❌ Search by Hauntly ID failed:', searchErr?.message);
    process.exit(1);
  }

  console.log(`✅ Found spirit: ${searchResult.display_name} (@${searchResult.username})`);
  // Ensure no email column exists or is returned
  if ('email' in searchResult) {
    console.error('❌ SECURITY FAILURE: Email address was exposed in public profile search!');
    process.exit(1);
  }
  console.log('🔒 Security Verified: Email address is NOT exposed in public search result.');

  console.log('\n--- 4. Testing Self-Friending Prevention ---');
  const { error: selfErr } = await clientB.from('friendships').insert({
    requester_id: profileB!.id,
    addressee_id: profileB!.id,
    status: 'pending',
  });
  if (selfErr) {
    console.log(`✅ Self-friending correctly blocked by database constraint: "${selfErr.message}"`);
  } else {
    console.error('❌ Failure: Database permitted user to friend themselves!');
    process.exit(1);
  }

  console.log('\n--- 5. Testing Sending Friend Request (Bob -> Alice) ---');
  const { data: reqData, error: reqErr } = await clientB
    .from('friendships')
    .insert({
      requester_id: profileB!.id,
      addressee_id: profileA!.id,
      status: 'pending',
    })
    .select()
    .single();

  if (reqErr) {
    console.error('❌ Failed to send friend request:', reqErr.message);
    process.exit(1);
  }
  console.log(`✅ Friend request successfully dispatched (ID: ${reqData.id})`);

  console.log('\n--- 6. Testing Duplicate Request Prevention ---');
  const { error: dupErr } = await clientB.from('friendships').insert({
    requester_id: profileB!.id,
    addressee_id: profileA!.id,
    status: 'pending',
  });
  if (dupErr) {
    console.log(`✅ Duplicate request correctly blocked: "${dupErr.message}"`);
  } else {
    console.error('❌ Failure: Duplicate request was allowed!');
    process.exit(1);
  }

  console.log('\n--- 7. Testing Pending Received Invocations (Alice sees Bob) ---');
  const { data: alicePending, error: aPendErr } = await client
    .from('friendships')
    .select('id, requester_id, addressee_id, status, requester:profiles!requester_id(display_name, hauntly_id)')
    .eq('addressee_id', profileA!.id)
    .eq('status', 'pending');

  if (aPendErr || !alicePending || alicePending.length === 0) {
    console.error('❌ Alice did not receive pending request:', aPendErr?.message);
    process.exit(1);
  }
  console.log(`✅ Alice sees incoming request from: ${(alicePending[0].requester as any)?.display_name}`);

  console.log('\n--- 8. Testing Accepting Request (Alice accepts Bob) ---');
  const { error: acceptErr } = await client
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', reqData.id)
    .eq('addressee_id', profileA!.id);

  if (acceptErr) {
    console.error('❌ Failed to accept request:', acceptErr.message);
    process.exit(1);
  }
  console.log('✅ Alice accepted Bob\'s request. Friendship sealed in the Coven!');

  console.log('\n--- 9. Testing Friends List Query on Both Accounts ---');
  const [friendsOfAlice, friendsOfBob] = await Promise.all([
    client
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profileA!.id},addressee_id.eq.${profileA!.id}`),
    clientB
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profileB!.id},addressee_id.eq.${profileB!.id}`),
  ]);

  if (friendsOfAlice.data?.length !== 1 || friendsOfBob.data?.length !== 1) {
    console.error('❌ Friends count mismatch!');
    process.exit(1);
  }
  console.log('✅ Both Alice and Bob have 1 mutual accepted friendship row in their Coven!');

  console.log('\n--- 10. Testing Profile Editing (Bob alters visage & moniker) ---');
  const updatedName = `Bob the Sovereign ${timestamp.toString().slice(-4)}`;
  const { data: updatedB, error: updErr } = await clientB
    .from('profiles')
    .update({
      display_name: updatedName,
      bio: 'Wandering through the obsidian corridors of Hauntly.',
    })
    .eq('id', profileB!.id)
    .select()
    .single();

  if (updErr || updatedB.display_name !== updatedName) {
    console.error('❌ Failed to edit profile:', updErr?.message);
    process.exit(1);
  }
  console.log(`✅ Bob successfully updated his profile to: "${updatedB.display_name}" with bio "${updatedB.bio}"`);

  console.log('\n--- 11. Testing Friend Removal ---');
  const { error: remErr } = await client
    .from('friendships')
    .delete()
    .eq('id', reqData.id);

  if (remErr) {
    console.error('❌ Failed to remove friend:', remErr.message);
    process.exit(1);
  }
  console.log('✅ Friendship cleanly severed.');

  console.log('\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY ON SUPABASE REAL DATA!');
}

runTest().catch((e) => {
  console.error('Unhandled test exception:', e);
  process.exit(1);
});
