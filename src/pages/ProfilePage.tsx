import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Profile } from '../types/profile';
import { ensureProfile, updateProfile } from '../lib/profileService';
import { FriendsHub } from '../components/friends/FriendsHub';
import { GothicChatSection } from '../components/chat/GothicChatSection';
import {
  Ghost,
  MessageSquare,
  Users,
  Compass,
  Settings,
  Copy,
  Check,
  Save,
  Lock,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sparkles,
  LogOut,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

// ── Halloween Avatars ──────────────────────────────────────────────────────────
const HALLOWEEN_AVATARS = [
  { id: 'witch_pumpkin', src: '/avatar_witch_pumpkin.png', label: 'Witch Pumpkin' },
  { id: 'cute_ghost',    src: '/avatar_cute_ghost.png',    label: 'Cute Ghost'    },
  { id: 'black_cat',     src: '/avatar_black_cat.png',     label: 'Black Cat'     },
  { id: 'skull',         src: '/avatar_skull.png',         label: 'Skull'         },
  { id: 'reaper',        src: '/avatar_reaper.png',        label: 'Grim Reaper'   },
  { id: 'frankenstein',  src: '/avatar_frankenstein.png',  label: 'Frankenstein'  },
  { id: 'pumpkin',       src: '/avatar_pumpkin.png',       label: 'Jack-O-Lantern'},
  { id: 'large_pumpkin', src: '/avatar_large_pumpkin.png', label: 'Large Pumpkin' },
];

const AVATARS_PER_PAGE = 6;

// ── Sidebar Nav Item ───────────────────────────────────────────────────────────
const SideNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200 cursor-pointer border-0 ${
      active
        ? 'bg-purple-700/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        : 'text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30'
    }`}
    title={label}
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-[9px] font-semibold tracking-wide uppercase leading-tight">{label}</span>
  </button>
);

// ── Profile Settings Page ──────────────────────────────────────────────────────
export const ProfilePage: React.FC<{
  defaultTab?: 'settings' | 'friends' | 'chats' | 'explore';
}> = ({ defaultTab }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as
    | 'settings'
    | 'friends'
    | 'chats'
    | 'explore'
    | null;

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'settings' | 'friends' | 'chats' | 'explore'>(
    defaultTab || tabParam || 'settings'
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatarPage, setAvatarPage] = useState(0);

  // UI state
  const [copiedId, setCopiedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalPages = Math.ceil(HALLOWEEN_AVATARS.length / AVATARS_PER_PAGE);
  const visibleAvatars = HALLOWEEN_AVATARS.slice(
    avatarPage * AVATARS_PER_PAGE,
    avatarPage * AVATARS_PER_PAGE + AVATARS_PER_PAGE
  );

  // Load profile on mount
  useEffect(() => {
    if (!user) return;
    ensureProfile(user).then(({ data }) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setSelectedAvatar(data.avatar_url || HALLOWEEN_AVATARS[0].src);
      }
      setLoadingProfile(false);
    });
  }, [user]);

  const handleCopyId = useCallback(() => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.hauntly_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [profile]);

  const handleSave = async () => {
    if (!profile || !user) return;
    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    setSaved(false);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      setSaving(false);
      return;
    }

    const { data, error } = await updateProfile(profile.id, {
      display_name: displayName.trim(),
      username: cleanUsername,
      avatar_url: selectedAvatar,
    });

    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#07030f]">
        <div className="flex flex-col items-center gap-4 text-purple-300">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
          <p className="text-xs font-mono text-purple-400/70">Summoning your spirit vessel...</p>
        </div>
      </div>
    );
  }

  if (!profile || !user) return null;

  // Clean formatted Hauntly ID
  const displayId = profile.hauntly_id.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top right, #2d0b5a 0%, #1a0533 30%, #0d0220 60%, #07030f 100%)',
      }}
    >
      {/* ── Atmospheric Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Moon */}
        <div
          className="absolute top-6 right-16 w-36 h-36 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, #c084fc 0%, #9333ea 40%, #7e22ce 70%, transparent 100%)',
            filter: 'blur(3px)',
            boxShadow: '0 0 70px 25px rgba(168,85,247,0.35)',
          }}
        />

        {/* Bats */}
        {['12%,62%', '7%,74%', '18%,82%', '4%,88%'].map((pos, i) => {
          const [top, left] = pos.split(',');
          return (
            <span key={i} className="absolute text-purple-800 opacity-40 animate-pulse" style={{ top, left, fontSize: `${14 + i * 2}px` }}>
              🦇
            </span>
          );
        })}

        {/* Haunted House Silhouette */}
        <div className="absolute bottom-0 right-0 w-64 h-72 opacity-15">
          <svg viewBox="0 0 300 350" fill="#3b0764" className="w-full h-full">
            <path d="M150 50 L200 120 L250 120 L250 300 L50 300 L50 120 L100 120 Z" />
            <path d="M140 50 L160 50 L160 0 Z" />
            <rect x="110" y="150" width="40" height="50" />
            <rect x="170" y="150" width="40" height="50" />
            <rect x="130" y="230" width="40" height="70" />
          </svg>
        </div>

        {/* Graveyard Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" fill="#1e1b4b" className="w-full h-full">
            <path d="M0,80 L0,60 L30,60 L30,40 Q35,25 40,40 L40,60 L80,60 L80,45 L85,30 L90,45 L90,60 L150,60 L150,80 Z M900,80 L900,60 L930,60 L930,40 Q935,25 940,40 L940,60 L990,60 L990,80 Z" />
          </svg>
        </div>

        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-800/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-60 h-60 bg-indigo-800/8 rounded-full blur-3xl" />
      </div>

      {/* ── Left Sidebar (Matching reference design) ── */}
      <aside
        className="relative z-10 w-20 flex-shrink-0 flex flex-col items-center py-5 gap-1 border-r border-purple-900/50"
        style={{ background: 'rgba(8,3,18,0.95)' }}
      >
        {/* Ghost Icon Logo */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center bg-purple-950/60 cursor-pointer"
            onClick={() => setActiveTab('settings')}
            title="Hauntly Realm"
          >
            <img src="/hauntly-icon.png" alt="Hauntly" className="w-full h-full object-cover" />
          </div>
        </div>

        <SideNavItem
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chats"
          active={activeTab === 'chats'}
          onClick={() => setActiveTab('chats')}
        />
        <SideNavItem
          icon={<Users className="w-5 h-5" />}
          label="Friends"
          active={activeTab === 'friends'}
          onClick={() => setActiveTab('friends')}
        />
        <SideNavItem
          icon={<Compass className="w-5 h-5" />}
          label="Explore"
          active={activeTab === 'explore'}
          onClick={() => setActiveTab('explore')}
        />
        <SideNavItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />

        <div className="mt-auto flex flex-col gap-1 w-full">
          <SideNavItem
            icon={<Moon className="w-5 h-5" />}
            label="Theme"
            onClick={() => {}}
          />
          <SideNavItem
            icon={<LogOut className="w-5 h-5" />}
            label="Exit"
            onClick={handleSignOut}
          />
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div
        className="relative z-10 flex-1 flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(16,6,34,0.97) 0%, rgba(10,4,22,0.97) 100%)' }}
      >
        {/* ═══ TAB 1: SETTINGS / PROFILE (Default on Login & Signup) ═══ */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h1 className="text-2xl font-serif font-black text-white tracking-wide">Settings</h1>
                </div>
                <p className="text-xs text-purple-300/60">
                  Customize your Hauntly experience! 🎃
                </p>
              </div>

              {/* Close / Action icon */}
              <button
                type="button"
                onClick={() => setActiveTab('friends')}
                className="w-8 h-8 rounded-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Go to Friends Hub"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent mx-8 flex-shrink-0" />

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* ══ Profile Box ══════════════════════════════════════════════ */}
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                      <Ghost className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif font-bold text-white">Profile</h2>
                      <p className="text-xs text-purple-300/60">Edit your avatar and name. Your unique ID is permanent! 👻</p>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border border-purple-800/40 p-5 space-y-6"
                    style={{ background: 'rgba(12,5,25,0.85)' }}
                  >
                    {/* ── Avatar Row: Large Preview + Avatar Picker ── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      {/* Large Preview with edit icon */}
                      <div className="relative shrink-0">
                        <div
                          className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-500/70"
                          style={{ boxShadow: '0 0 35px rgba(168,85,247,0.55), inset 0 0 15px rgba(168,85,247,0.1)' }}
                        >
                          <img
                            src={selectedAvatar}
                            alt="Your avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/hauntly-icon.png'; }}
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-700 border-2 border-[#0a0315] flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.6)]">
                          <Pencil className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      {/* Avatar Picker */}
                      <div className="flex-1 space-y-2.5">
                        <p className="text-sm font-semibold text-white">Choose a Halloween Avatar 🎃</p>
                        <div className="flex items-center gap-2.5">
                          {/* Previous arrow */}
                          {totalPages > 1 && (
                            <button
                              type="button"
                              onClick={() => setAvatarPage((p) => (p - 1 + totalPages) % totalPages)}
                              className="w-9 h-9 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 flex items-center justify-center transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] shrink-0"
                              title="Previous avatars"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {visibleAvatars.map((av) => {
                              const isSelected = selectedAvatar === av.src;
                              return (
                                <button
                                  key={av.id}
                                  type="button"
                                  onClick={() => setSelectedAvatar(av.src)}
                                  title={av.label}
                                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.7)] scale-110 z-10'
                                      : 'border-purple-900/50 hover:border-purple-600/70 hover:scale-105 opacity-70 hover:opacity-100'
                                  }`}
                                  style={{ width: '52px', height: '52px' }}
                                >
                                  <img
                                    src={av.src}
                                    alt={av.label}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/hauntly-icon.png'; }}
                                  />
                                  {isSelected && (
                                    <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Next arrow */}
                          {totalPages > 1 && (
                            <button
                              type="button"
                              onClick={() => setAvatarPage((p) => (p + 1) % totalPages)}
                              className="w-9 h-9 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 flex items-center justify-center transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] shrink-0"
                              title="Next avatars"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-purple-400/50 font-mono">
                          Page {avatarPage + 1} of {totalPages}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-purple-900/40" />

                    {/* ── Display Name ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-sm font-semibold text-white">Your Name</span>
                      </div>
                      <p className="text-xs text-purple-400/60">This can be changed anytime.</p>
                      <div className="relative">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          maxLength={40}
                          placeholder="Enter your spirit name..."
                          className="w-full text-sm bg-[#0a0418]/90 text-white placeholder-purple-400/40 rounded-xl border border-purple-800/50 hover:border-purple-700/70 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] px-4 py-3 pr-12 outline-none transition-all duration-300 font-medium"
                        />
                        <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* ── Username ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400 font-mono font-bold text-sm">@</span>
                        <span className="text-sm font-semibold text-white">Username</span>
                      </div>
                      <p className="text-xs text-purple-400/60">Your public @handle across the Hauntly realm.</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-mono font-bold text-sm pointer-events-none">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          maxLength={30}
                          placeholder="shadow_weaver"
                          className="w-full text-sm bg-[#0a0418]/90 text-white placeholder-purple-400/40 rounded-xl border border-purple-800/50 hover:border-purple-700/70 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] pl-8 pr-4 py-3 outline-none transition-all duration-300 font-mono"
                        />
                      </div>
                    </div>

                    <div className="h-px bg-purple-900/40" />

                    {/* ── Unique Hauntly ID ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-sm font-semibold text-white">Your Unique ID</span>
                      </div>
                      <p className="text-xs text-purple-400/60">This is permanent and cannot be changed.</p>

                      <div className="flex items-center gap-3">
                        {/* ID field */}
                        <div className="flex-1 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-mono font-bold text-sm pointer-events-none">#</span>
                          <div className="w-full text-sm bg-[#070210]/90 text-purple-200 rounded-xl border border-purple-800/40 pl-8 pr-12 py-3 font-mono font-semibold tracking-wider select-all cursor-text">
                            {displayId}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyId}
                            title="Copy Hauntly ID"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                          >
                            {copiedId ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Lock badge */}
                        <div className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-700/30 border border-purple-600/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                          <Lock className="w-3 h-3 text-purple-300 shrink-0" />
                          <div className="leading-tight">
                            <div className="text-[11px] font-semibold">Unique ID</div>
                            <div className="text-[9px] text-purple-300/70 font-normal">(Cannot be changed)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error / Success notice */}
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    {saved && (
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Profile saved successfully! ✨</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* ── Save Button (sticky footer matching reference design) ── */}
            <div className="flex-shrink-0 px-8 pb-7 pt-3 max-w-2xl mx-auto w-full">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold tracking-wide text-white transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: saving
                    ? 'rgba(107,33,168,0.5)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
                  boxShadow: saving ? 'none' : '0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving Changes...</span></>
                ) : (
                  <><Save className="w-4 h-4" /><span>Save Changes</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: FRIENDS HUB (Coven, Add Friend by ID, Requests, Banished) ═══ */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h1 className="text-xl sm:text-2xl font-serif font-black text-white">The Coven Circle</h1>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-purple-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>
            </div>
            <FriendsHub currentUserId={user.id} />
          </div>
        )}

        {/* ═══ TAB 3: CHATS (Connected to real friends) ═══ */}
        {activeTab === 'chats' && (
          <GothicChatSection onNavigateToFriends={() => setActiveTab('friends')} />
        )}

        {/* ═══ TAB 4: EXPLORE ═══ */}
        {activeTab === 'explore' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex items-center justify-center">
            <div className="text-center space-y-3 max-w-sm">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
              <h2 className="text-lg font-serif font-bold text-white">Ethereal Realm Exploration</h2>
              <p className="text-xs text-purple-300/70">
                Wander through the haunted halls of Hauntly. Connect with fellow spirits or configure your coven.
              </p>
              <button
                onClick={() => setActiveTab('friends')}
                className="px-4 py-2 rounded-xl bg-purple-700/60 hover:bg-purple-600/80 border border-purple-500/50 text-white text-xs font-semibold cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Summon Companions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
