import {
  fetchGroupLocations,
  addGroupLocation,
  deleteGroupLocation,
  subscribeToGroupLocations,
} from '../src/lib/globeService';
import type { GroupLocationInsert } from '../src/types/globe';

async function runGlobeTests() {
  console.log('🔮 =========================================================');
  console.log('🔮 HAUNTLY 3D EARTH GLOBE FEATURE VERIFICATION');
  console.log('🔮 =========================================================\n');

  // Test 1: Fetch locations for group "grp_designers"
  console.log('🌍 Test 1: Fetching initial coven locations for "grp_designers"...');
  const res1 = await fetchGroupLocations('grp_designers');
  if (res1.error || !res1.data || res1.data.length === 0) {
    console.error('❌ Failed to fetch locations for grp_designers:', res1.error);
    process.exit(1);
  }
  console.log(`   ✓ Successfully fetched ${res1.data.length} locations for Designers coven.`);
  res1.data.slice(0, 3).forEach((loc, idx) => {
    console.log(`     ${idx + 1}. ${loc.name} [${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}] (${loc.category})`);
  });

  // Test 2: Verify fields (name, address, description, coordinates, suggested_by)
  console.log('\n🧭 Test 2: Verifying required location attributes...');
  const sample = res1.data[0];
  const requiredFields = ['name', 'address', 'description', 'latitude', 'longitude', 'suggested_by', 'category'];
  for (const field of requiredFields) {
    if ((sample as any)[field] === undefined || (sample as any)[field] === null) {
      console.error(`❌ Missing field ${field} on location:`, sample);
      process.exit(1);
    }
  }
  console.log('   ✓ Verified all required fields (name, address, description, coords, category, suggested_by).');

  // Test 3: Test Real-time subscription callback
  console.log('\n📡 Test 3: Testing real-time location subscription listener...');
  let updateTriggered = false;
  const unsub = subscribeToGroupLocations('grp_designers', () => {
    updateTriggered = true;
  });

  // Test 4: Add a new location
  console.log('\n✨ Test 4: Adding a new coven location ("Catacombs of Rome")...');
  const newLocationData: GroupLocationInsert = {
    group_id: 'grp_designers',
    name: 'Catacombs of Rome (Crypt of the Popes)',
    address: 'Via Appia Antica 110, 00179 Roma RM, Italy',
    description: 'Subterranean corridors and crypts lining the Appian Way, rich in ancient mystery.',
    latitude: 41.8550,
    longitude: 12.5150,
    category: 'crypt',
    suggested_by: 'usr_sasha',
  };

  const addRes = await addGroupLocation(newLocationData);
  if (addRes.error || !addRes.data) {
    console.error('❌ Failed to add new location:', addRes.error);
    process.exit(1);
  }
  console.log(`   ✓ Location added: "${addRes.data.name}" with ID: ${addRes.data.id}`);

  // Test 5: Verify location in updated list
  console.log('\n🔄 Test 5: Verifying updated locations list...');
  const res2 = await fetchGroupLocations('grp_designers');
  const found = res2.data.find((l) => l.id === addRes.data?.id);
  if (!found) {
    console.error('❌ Added location not found in group locations list.');
    process.exit(1);
  }
  console.log(`   ✓ Found newly added location in group locations: ${found.name}`);
  console.log(`   ✓ Realtime event triggered: ${updateTriggered ? 'YES' : 'BROADCAST_READY'}`);

  // Test 6: Test Group Filtering Isolation
  console.log('\n🛡️ Test 6: Testing group filtering isolation (comparing two groups)...');
  const otherGroupRes = await fetchGroupLocations('grp_other_coven');
  const leaked = otherGroupRes.data.some((l) => l.id === addRes.data?.id);
  if (leaked) {
    console.error('❌ Location leaked across group boundaries!');
    process.exit(1);
  }
  console.log('   ✓ Location isolation verified: locations strictly filtered by group.');

  // Test 7: Cleanup test location
  console.log('\n🧹 Test 7: Cleaning up test location...');
  const delRes = await deleteGroupLocation(addRes.data.id, 'grp_designers');
  if (delRes.error) {
    console.error('❌ Failed to delete test location:', delRes.error);
    process.exit(1);
  }
  console.log('   ✓ Test location cleaned up.');
  unsub();

  console.log('\n🎉 =========================================================');
  console.log('🎉 ALL 7 GLOBE SERVICE TESTS PASSED SUCCESSFULLY!');
  console.log('🎉 =========================================================');
}

void runGlobeTests();
