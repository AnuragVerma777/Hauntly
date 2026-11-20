import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Profile } from '../types/profile';
import type { Group } from '../types/groupChat';
import type { GroupLocation, GlobeViewMode } from '../types/globe';
import { ensureProfile } from '../lib/profileService';
import { fetchUserGroups } from '../lib/groupChatService';
import {
  fetchGroupLocations,
  addGroupLocation,
  subscribeToGroupLocations,
} from '../lib/globeService';
import { subscribeToLocationVotes } from '../lib/locationSuggestionService';
import { HauntlyGlobe } from '../components/globe/HauntlyGlobe';
import { LocationDetailCard } from '../components/globe/LocationDetailCard';
import { LocationListView } from '../components/globe/LocationListView';
import { AddLocationModal } from '../components/globe/AddLocationModal';
import {
  Ghost,
  MessageSquare,
  Users,
  Compass,
  Settings,
  ChevronDown,
  Loader2,
  LogOut,
  Moon,
} from 'lucide-react';

const FALLBACK_GROUP_DATE = '2026-11-19T00:00:00.000Z';

export const GlobePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramGroupId = searchParams.get('groupId');
  const paramLocationId = searchParams.get('locationId');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [locations, setLocations] = useState<GroupLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<GroupLocation | null>(null);

  const [viewMode, setViewMode] = useState<GlobeViewMode>('globe');
  const [globeFailed, setGlobeFailed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  // 1. Load initial user profile & groups
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) return;
      const [pRes, gRes] = await Promise.all([
        ensureProfile(user),
        fetchUserGroups(user.id),
      ]);

      if (!active) return;
      if (pRes.data) setProfile(pRes.data);
      if (gRes.data && gRes.data.length > 0) {
        setGroups(gRes.data);
        // Default to query group if valid, otherwise Designers or first group
        let defaultId = gRes.data[0].id;
        if (paramGroupId && gRes.data.some((g) => g.id === paramGroupId)) {
          defaultId = paramGroupId;
        } else {
          const designers = gRes.data.find((g) => g.id === 'grp_designers');
          if (designers) defaultId = designers.id;
        }

        setTimeout(() => {
          if (active) setSelectedGroupId(defaultId);
        }, 0);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [user, paramGroupId]);

  // 2. Load locations for active group
  const loadLocations = useCallback(async (groupId: string) => {
    setLoadingLocations(true);
    const res = await fetchGroupLocations(groupId);
    if (res.data) {
      setLocations(res.data);
      if (paramLocationId) {
        const found = res.data.find((l) => l.id === paramLocationId);
        if (found) {
          setSelectedLocation(found);
          setViewMode('globe');
        }
      } else {
        // If previously selected location is no longer in list, clear it
        setSelectedLocation((prev) =>
          prev ? res.data.find((l) => l.id === prev.id) || null : null
        );
      }
    }
    setLoadingLocations(false);
  }, [paramLocationId]);

  useEffect(() => {
    let active = true;
    if (!selectedGroupId) return;
    setTimeout(() => {
      if (active) void loadLocations(selectedGroupId);
    }, 0);

    // 3. Realtime subscription for location additions/updates and votes
    const unsubLocs = subscribeToGroupLocations(selectedGroupId, () => {
      if (active) void loadLocations(selectedGroupId);
    });
    const unsubVotes = subscribeToLocationVotes(selectedGroupId, () => {
      if (active) void loadLocations(selectedGroupId);
    });

    return () => {
      active = false;
      unsubLocs();
      unsubVotes();
    };
  }, [selectedGroupId, loadLocations]);

  const activeGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0] || {
      id: 'grp_designers',
      name: 'Designers',
      description: 'A creative space for designers, developers & dreamers. 🌙',
      avatar_url: '/chat/avatar_designers_hero.png',
      created_by: null,
      created_at: FALLBACK_GROUP_DATE,
      updated_at: FALLBACK_GROUP_DATE,
      member_count: 40,
    };

  const handleGlobeError = (error: Error) => {
    console.warn('Globe rendering error, transitioning to list view fallback:', error);
    setGlobeFailed(true);
    setViewMode('list');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070212] text-white select-none">
      {/* ══════════════════════════════════════════════════════════════════
          LEFT VERTICAL NAVIGATION SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        className="w-16 sm:w-20 flex-shrink-0 flex flex-col items-center justify-between py-6 border-r border-purple-900/30 z-40"
        style={{
          background: 'linear-gradient(180deg, #100424 0%, #070114 100%)',
        }}
      >
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <div
            onClick={() => navigate('/chat')}
            className="w-10 h-10 rounded-2xl bg-purple-900/50 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer hover:scale-105 transition-transform"
            title="Hauntly Home"
          >
            <Ghost className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {/* Chats */}
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30 transition-all cursor-pointer"
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wide uppercase">Chats</span>
            </button>

            {/* Friends */}
            <button
              type="button"
              onClick={() => navigate('/profile?tab=friends')}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30 transition-all cursor-pointer"
              title="Friends"
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wide uppercase">Friends</span>
            </button>

            {/* Explore / Globe (Active) */}
            <button
              type="button"
              onClick={() => navigate('/globe')}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl bg-purple-700/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-purple-500/40 transition-all cursor-pointer"
              title="3D Earth Globe"
            >
              <Compass className="w-5 h-5 text-purple-200" />
              <span className="text-[9px] font-semibold tracking-wide uppercase text-white font-bold">
                Explore
              </span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30 transition-all cursor-pointer"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wide uppercase">Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <div className="w-9 h-9 rounded-2xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400">
            <Moon className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-9 h-9 rounded-2xl bg-purple-950/40 hover:bg-rose-950/60 border border-purple-900/30 hover:border-rose-800/40 flex items-center justify-center text-purple-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN GLOBE STAGE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header
          className={`px-6 z-30 transition-all ${
            viewMode === 'globe' && !globeFailed
              ? 'absolute top-0 left-0 right-0 py-4 flex items-center justify-between pointer-events-none bg-gradient-to-b from-[#05010d]/80 via-[#05010d]/30 to-transparent'
              : 'h-16 border-b border-purple-900/40 flex items-center justify-between flex-shrink-0 bg-[#0f0520]/85 backdrop-blur-md'
          }`}
        >
          {/* Left: Group Switcher Dropdown */}
          <div className={`relative pointer-events-auto ${viewMode === 'globe' && !globeFailed ? 'ml-36 sm:ml-44' : ''}`}>
            <button
              type="button"
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/50 border border-purple-800/40 text-left transition-all cursor-pointer group shadow-sm backdrop-blur-md"
            >
              <img
                src={activeGroup.avatar_url || '/chat/avatar_designers_hero.png'}
                alt={activeGroup.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-purple-500/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
                }}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    {activeGroup.name}
                  </h2>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-purple-400 transition-transform ${
                      groupDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-purple-300/70">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Coven Grid
                  </span>
                  <span>•</span>
                  {loadingLocations ? (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Attuning...
                    </span>
                  ) : (
                    <span>{locations.length} Sanctuaries</span>
                  )}
                </div>
              </div>
            </button>

            {/* Group Switcher Dropdown Menu */}
            {groupDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#14062b] border border-purple-700/50 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.7)] z-50 animate-fadeIn"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/70 px-2 py-1 block">
                  Switch Coven Earth:
                </span>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setGroupDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedGroupId === g.id
                          ? 'bg-purple-800/60 text-white border border-purple-500/50'
                          : 'hover:bg-purple-900/40 text-purple-200'
                      }`}
                    >
                      <img
                        src={g.avatar_url || '/chat/avatar_designers_hero.png'}
                        alt={g.name}
                        className="w-7 h-7 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block truncate">{g.name}</span>
                        <span className="text-[10px] text-purple-400/60 block truncate">
                          {g.description || 'Active Circle'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right spacer */}
          <div className="pointer-events-none" />
        </header>

        {/* Body Area: 3D Globe View OR List View Fallback */}
        <main className="flex-1 relative overflow-hidden">
          {viewMode === 'globe' && !globeFailed ? (
            <>
              {/* 3D MapLibre Globe */}
              <HauntlyGlobe
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectLocation={(loc) => setSelectedLocation(loc)}
                onGlobeError={handleGlobeError}
              />

              {/* Floating Location Detail Card (Bottom Right) */}
              {selectedLocation && (
                <div className="absolute bottom-8 right-8 z-30 max-w-sm sm:max-w-md w-full">
                  <LocationDetailCard
                    location={selectedLocation}
                    onClose={() => setSelectedLocation(null)}
                    onFlyTo={(loc) => setSelectedLocation(loc)}
                  />
                </div>
              )}
            </>
          ) : (
            <LocationListView
              locations={locations}
              group={activeGroup}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              onOpenAddModal={() => setShowAddModal(true)}
              isFallback={globeFailed}
              onSwitchToGlobe={() => {
                setGlobeFailed(false);
                setViewMode('globe');
              }}
            />
          )}
        </main>

        {/* Add Location Modal */}
        {showAddModal && profile && (
          <AddLocationModal
            group={activeGroup}
            currentUserId={profile.id}
            onClose={() => setShowAddModal(false)}
            onLocationAdded={(newLoc) => {
              setLocations((prev) => [newLoc, ...prev]);
              setSelectedLocation(newLoc);
            }}
            onSubmit={addGroupLocation}
          />
        )}
      </div>
    </div>
  );
};
