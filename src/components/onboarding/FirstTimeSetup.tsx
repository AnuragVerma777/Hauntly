import React, { useState, useEffect, useCallback } from 'react';
import type { Profile } from '../../types/profile';
import { updateProfile } from '../../lib/profileService';
import { markOnboardingComplete } from './onboardingState';
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
  Moon,
  Sparkles,
  X,
} from 'lucide-react';

// ── Halloween Avatar Options ───────────────────────────────────────────────────
const HALLOWEEN_AVATARS = [
  { id: 'witch_pumpkin',  src: '/avatar_witch_pumpkin.png',   label: 'Witch Pumpkin'   },
  { id: 'cute_ghost',     src: '/avatar_cute_ghost.png',      label: 'Cute Ghost'      },
  { id: 'black_cat',      src: '/avatar_black_cat.png',       label: 'Black Cat'       },
  { id: 'skull',          src: '/avatar_skull.png',           label: 'Skull'           },
  { id: 'reaper',         src: '/avatar_reaper.png',          label: 'Grim Reaper'     },
  { id: 'frankenstein',   src: '/avatar_frankenstein.png',    label: 'Frankenstein'    },
  { id: 'pumpkin',        src: '/avatar_pumpkin.png',         label: 'Jack-O-Lantern'  },
  { id: 'large_pumpkin',  src: '/avatar_large_pumpkin.png',   label: 'Large Pumpkin'   },
];

// ── Sidebar Nav Item ───────────────────────────────────────────────────────────
interface SideNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SideNavItem: React.FC<SideNavItemProps> = ({ icon, label, active = false }) => (
  <div
    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl cursor-pointer transition-all duration-200 ${
      active
        ? 'bg-purple-700/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        : 'text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30'
    }`}
    title={label}
  >
    <div className={`w-6 h-6 ${active ? 'text-purple-200' : ''}`}>{icon}</div>
    <span className="text-[9px] font-semibold tracking-wide uppercase">{label}</span>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
interface FirstTimeSetupProps {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({ profile, onComplete }) => {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    profile.avatar_url || HALLOWEEN_AVATARS[0].src
  );
  const [avatarPage, setAvatarPage] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const AVATARS_PER_PAGE = 6;
  const totalPages = Math.ceil(HALLOWEEN_AVATARS.length / AVATARS_PER_PAGE);
  const visibleAvatars = HALLOWEEN_AVATARS.slice(
    avatarPage * AVATARS_PER_PAGE,
    avatarPage * AVATARS_PER_PAGE + AVATARS_PER_PAGE
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(profile.hauntly_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMsg('Your spirit name cannot be empty!');
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const { data, error } = await updateProfile(profile.id, {
        display_name: displayName.trim(),
        avatar_url: selectedAvatar,
      });

      if (error) {
        setErrorMsg(error.message);
        setSaving(false);
        return;
      }

      markOnboardingComplete(profile.id);
      onComplete(data ?? { ...profile, display_name: displayName.trim(), avatar_url: selectedAvatar });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  // ── Keyboard: Escape to skip (optional graceful skip) ──────────────────────
  const handleSkip = useCallback(() => {
    markOnboardingComplete(profile.id);
    onComplete(profile);
  }, [profile, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top right, #2d0b5a 0%, #1a0533 30%, #0d0220 60%, #07030f 100%)',
      }}
    >
      {/* ── Atmospheric Background Elements ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Moon */}
        <div
          className="absolute top-6 right-16 w-32 h-32 rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, #c084fc 0%, #9333ea 40%, #7e22ce 70%, transparent 100%)',
            filter: 'blur(2px)',
            boxShadow: '0 0 60px 20px rgba(168,85,247,0.4)',
          }}
        />

        {/* Haunted house silhouette (right side) */}
        <div className="absolute bottom-0 right-0 w-72 h-80 opacity-20">
          <svg viewBox="0 0 300 350" fill="currentColor" className="text-purple-950 w-full h-full">
            <path d="M150 50 L200 120 L250 120 L250 300 L50 300 L50 120 L100 120 Z" />
            <path d="M140 50 L160 50 L160 0 Z" />
            <rect x="110" y="150" width="40" height="50" />
            <rect x="170" y="150" width="40" height="50" />
            <rect x="130" y="230" width="40" height="70" />
          </svg>
        </div>

        {/* Bats */}
        {[
          { top: '12%', left: '60%', scale: 0.7 },
          { top: '8%', left: '72%', scale: 0.9 },
          { top: '20%', left: '80%', scale: 0.6 },
          { top: '5%', right: '15%', scale: 0.8 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute opacity-50 animate-pulse text-purple-800"
            style={{ top: pos.top, left: pos.left, right: (pos as any).right, transform: `scale(${pos.scale})` }}
          >
            🦇
          </div>
        ))}

        {/* Graveyard silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 h-20 opacity-25 text-purple-950">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" fill="currentColor" className="w-full h-full">
            <path d="M0,80 L0,60 L30,60 L30,40 Q35,25 40,40 L40,60 L80,60 L80,45 L85,30 L90,45 L90,60 L150,60 L150,50 Q160,30 170,50 L170,60 L250,60 L250,80 Z" />
            <path d="M900,80 L900,60 L930,60 L930,40 Q935,25 940,40 L940,60 L980,60 L980,45 L985,30 L990,45 L990,60 L1050,60 L1050,50 Q1060,30 1070,50 L1070,60 L1200,60 L1200,80 Z" />
          </svg>
        </div>

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-700/10 rounded-full blur-3xl" />
      </div>

      {/* ── Main Shell ── */}
      <div className="relative w-full max-w-5xl mx-4 h-[90vh] max-h-[640px] flex rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(147,51,234,0.5)] border border-purple-700/40">

        {/* ── Left Sidebar ── */}
        <aside
          className="w-20 flex-shrink-0 flex flex-col items-center py-6 gap-1 border-r border-purple-900/50"
          style={{ background: 'rgba(10,4,22,0.95)' }}
        >
          {/* Logo */}
          <div className="mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <img src="/hauntly-icon.png" alt="Hauntly" className="w-full h-full object-cover" />
            </div>
          </div>

          <SideNavItem icon={<Ghost className="w-5 h-5" />} label="Home" />
          <SideNavItem icon={<MessageSquare className="w-5 h-5" />} label="Chats" />
          <SideNavItem icon={<Users className="w-5 h-5" />} label="Friends" />
          <SideNavItem icon={<Compass className="w-5 h-5" />} label="Explore" />
          <SideNavItem icon={<Settings className="w-5 h-5" />} label="Settings" active />

          <div className="mt-auto">
            <SideNavItem icon={<Moon className="w-5 h-5" />} label="Theme" />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div
          className="flex-1 flex flex-col overflow-y-auto"
          style={{
            background:
              'linear-gradient(135deg, rgba(20,8,42,0.98) 0%, rgba(14,5,28,0.98) 50%, rgba(10,4,20,0.98) 100%)',
          }}
        >
          {/* ── Top Header ── */}
          <div className="flex items-center justify-between px-8 pt-7 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Settings className="w-5 h-5 text-purple-400" />
                <h1 className="text-2xl font-serif font-black text-white tracking-wide">Settings</h1>
              </div>
              <p className="text-xs text-purple-300/70">
                Customize your Hauntly experience! 🎃
              </p>
            </div>
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30 transition-all cursor-pointer"
              title="Skip for now (press Escape)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent mx-8 mb-6" />

          {/* ── Scrollable Body ── */}
          <div className="flex-1 px-8 pb-8 space-y-8">
            {/* ═══ Profile Section ════════════════════════════════════════════ */}
            <section className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-purple-300">
                  <Ghost className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-white">Profile</h2>
                  <p className="text-xs text-purple-300/60">
                    Edit your avatar and name. Your unique ID is permanent! 👻
                  </p>
                </div>
              </div>

              {/* Avatar + Picker Row */}
              <div className="p-5 rounded-2xl border border-purple-800/40 space-y-5"
                style={{ background: 'rgba(15,6,30,0.80)' }}>

                {/* ── Top Row: Preview + Picker ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Large Avatar Preview */}
                  <div className="relative shrink-0">
                    <div
                      className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-500/70"
                      style={{ boxShadow: '0 0 30px rgba(168,85,247,0.5), inset 0 0 20px rgba(168,85,247,0.1)' }}
                    >
                      <img
                        src={selectedAvatar}
                        alt="Selected avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/hauntly-icon.png'; }}
                      />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-purple-700 border-2 border-[#0d0520] flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Avatar Grid */}
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Choose a Halloween Avatar 🎃
                    </p>

                    <div className="flex items-center gap-2.5">
                      {/* Visible avatars */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {visibleAvatars.map((av) => {
                          const isSelected = selectedAvatar === av.src;
                          return (
                            <button
                              key={av.id}
                              type="button"
                              onClick={() => setSelectedAvatar(av.src)}
                              title={av.label}
                              className={`relative w-13 h-13 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
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
                                <div className="absolute inset-0 bg-purple-500/20 flex items-end justify-end p-0.5">
                                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Page arrow */}
                      {totalPages > 1 && (
                        <button
                          type="button"
                          onClick={() => setAvatarPage((p) => (p + 1) % totalPages)}
                          className="w-9 h-9 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 flex items-center justify-center transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                          title="See more avatars"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-purple-900/40" />

                {/* ── Your Name ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Your Name</span>
                  </div>
                  <p className="text-xs text-purple-400/60">This can be changed anytime.</p>

                  <div className="relative group">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onFocus={() => setEditingName(true)}
                      onBlur={() => setEditingName(false)}
                      maxLength={40}
                      placeholder="Enter your spirit name..."
                      className={`w-full text-sm bg-[#0a0418]/90 text-white placeholder-purple-400/40 rounded-xl border px-4 py-3 pr-12 outline-none transition-all duration-300 font-medium ${
                        editingName
                          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                          : 'border-purple-800/50 hover:border-purple-700/70'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingName(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-purple-900/40" />

                {/* ── Unique Hauntly ID ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Your Unique ID</span>
                  </div>
                  <p className="text-xs text-purple-400/60">
                    This is permanent and cannot be changed.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-mono font-bold text-sm">#</div>
                      <div
                        className="w-full text-sm bg-[#0a0418]/90 text-purple-200 rounded-xl border border-purple-800/50 px-4 py-3 pl-8 pr-12 font-mono font-semibold tracking-wider"
                        style={{ cursor: 'default' }}
                      >
                        {profile.hauntly_id.replace('HAUNT-', '').toLowerCase()}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        title="Copy Hauntly ID"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                      >
                        {copiedId ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Permanent badge */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-700/30 border border-purple-600/50 text-xs font-semibold text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                      <Lock className="w-3 h-3 text-purple-300" />
                      <div className="leading-tight">
                        <div className="text-[11px]">Unique ID</div>
                        <div className="text-[9px] text-purple-300/70 font-normal">(Cannot be changed)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Save Button (Sticky Bottom) ── */}
          <div className="px-8 pb-7 pt-3">
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
                <>
                  <div className="w-4 h-4 border-2 border-purple-300/40 border-t-purple-200 rounded-full animate-spin" />
                  <span>Binding Soul...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
