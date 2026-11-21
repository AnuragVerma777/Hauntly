import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types/profile';
import { searchByHauntlyId, getProfile, createInviteUrl, createCompanionFromId } from '../../lib/profileService';
import { getOrCreateConversation } from '../../lib/directChatService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Search,
  MessageSquare,
  AlertCircle,
  Loader2,
  Ghost,
  Copy,
  Check,
  Share2,
  Sparkles,
  CloudOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AddFriendSectionProps {
  currentUserId: string;
  initialQuery?: string;
  friendCount?: number;
  onNavigateToFriends?: () => void;
  onRequestSent?: () => void;
}

export const AddFriendSection: React.FC<AddFriendSectionProps> = ({
  currentUserId,
  initialQuery = '',
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedProfile, setSearchedProfile] = useState<Profile | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const [showCloudHelp, setShowCloudHelp] = useState(false);

  // Current user's own profile for sharing
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    getProfile(currentUserId).then(({ data }) => {
      if (data) setMyProfile(data);
    });
  }, [currentUserId]);

  const executeSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    setErrorMsg(null);
    setIsSearching(true);
    setSearchDone(false);
    setSearchedProfile(null);
    setIsLifted(true);

    try {
      const { data, error } = await searchByHauntlyId(query);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSearchedProfile(data);
      }
      setSearchDone(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed across the ethereal plane.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search if initialQuery was supplied via URL link
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery.trim());
      executeSearch(initialQuery.trim());
    }
  }, [initialQuery, executeSearch]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSearch(searchQuery);
  };

  const handleStartWhisper = async (targetProfile: Profile) => {
    if (!currentUserId || !targetProfile) return;
    setIsStartingChat(true);
    try {
      // Create or attune conversation record directly with no friend request needed
      await getOrCreateConversation({
        currentUserId,
        partnerId: targetProfile.id,
        partnerProfile: targetProfile,
      });
      // Navigate straight to direct chat
      navigate(`/chat?friendId=${targetProfile.id}`);
    } catch (err) {
      console.warn('Failed to start whisper:', err);
      navigate(`/chat?friendId=${targetProfile.id}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  const getInviteUrl = () => {
    if (myProfile) {
      return createInviteUrl(myProfile);
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hauntly-eight.vercel.app';
    return `${origin}/profile?addFriend=HAUNT-MYID`;
  };

  const handleCopyLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyMyId = () => {
    if (!myProfile) return;
    navigator.clipboard.writeText(myProfile.hauntly_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2200);
  };

  const handleShareInvite = async () => {
    const url = getInviteUrl();
    const shareData = {
      title: 'Whisper with me on Hauntly',
      text: `Connect and whisper with me on Hauntly! Find me using my ID #${myProfile?.hauntly_id.toLowerCase()}:`,
      url,
    };

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    handleCopyLink();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-[#050a07] border border-emerald-950/40 shadow-[0_0_60px_rgba(4,20,10,0.8)] text-white">
      {/* Deep Nocturnal Foggy Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#0d1f14_0%,#060f09_55%,#020604_100%)] pointer-events-none" />

      {/* Atmospheric Giant Background Watermark Typography: "HALLOWEEN" */}
      <div className="absolute inset-x-0 top-12 flex justify-center pointer-events-none select-none overflow-hidden z-0">
        <span className="font-serif font-black text-6xl sm:text-8xl md:text-9xl tracking-[0.22em] text-emerald-100/[0.035] uppercase whitespace-nowrap transform -translate-y-4">
          HALLOWEEN
        </span>
      </div>

      {/* Subtle misty fog overlay at base */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#020503] via-[#041008]/40 to-transparent pointer-events-none z-10" />

      <div className="relative z-20 p-5 sm:p-8 md:p-10 flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-emerald-900/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff32] shadow-[0_0_10px_#d4ff32] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              Spirit Search &amp; Direct Whispers
            </span>
          </div>
        </div>

        {/* Main Content: Hero Typography & Spirit Search Input */}
        <div className="max-w-xl mx-auto w-full py-8 space-y-6 flex-1">
          <div className="relative">
            {/* Flying Bat Silhouette Animation during Active state */}
            {isLifted && (
              <div className="absolute -top-10 left-6 animate-bat-swoop pointer-events-none z-30">
                <svg
                  className="w-10 h-10 text-neutral-200 fill-current animate-bat-flap filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5C9.5 2 4 3 2 6c0 4 3 7 7 6-1 2-2 4-2 6 2 0 4-2 5-4 1 2 3 4 5 4 0-2-1-4-2-6 4 1 7-2 7-6-2-3-7.5-4-10-1.5z" />
                </svg>
              </div>
            )}

            {/* Dynamic Kinetic Headline */}
            <div className="flex flex-col justify-center transition-all duration-700">
              {!isLifted ? (
                <div className="space-y-3 animate-fadeIn text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif uppercase tracking-tight text-white leading-none">
                    SEARCH SPIRITS &amp; <br />
                    <span className="text-[#d4ff32] drop-shadow-[0_0_20px_rgba(212,255,50,0.4)]">
                      START WHISPERING
                    </span>
                  </h2>
                  <p className="text-sm text-neutral-400 font-sans max-w-md leading-relaxed mx-auto sm:mx-0">
                    Find any registered user by their exact username or unique Hauntly ID and initiate direct private whispers instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif uppercase tracking-tight text-white leading-none">
                    DIRECT PRIVATE <br />
                    <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                      CONVERSATIONS
                    </span>
                  </h2>
                  <p className="text-sm text-neutral-300 font-sans max-w-md leading-relaxed mx-auto sm:mx-0">
                    No friend approval required. Locate any spirit and converse immediately through encrypted whispers.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cloud Sync Status Banner */}
          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200/90 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cloud Database: Local Device Mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCloudHelp((prev) => !prev)}
                  className="text-[11px] font-mono text-[#d4ff32] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Connect Supabase Cloud</span>
                  {showCloudHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-300/70 leading-relaxed">
                Direct whispers are stored securely on your device. You can connect across devices immediately by typing your friend&apos;s ID below or using your <b>Invite Link</b>!
              </p>
              {showCloudHelp && (
                <div className="pt-2 border-t border-amber-900/40 text-[11px] text-neutral-300 space-y-1.5 font-mono">
                  <p className="text-white font-semibold font-sans">To enable global search across all devices worldwide:</p>
                  <p>1. Open your Supabase Dashboard &gt; Project Settings &gt; API.</p>
                  <p>2. In your Vercel Project Settings &gt; Environment Variables, add:</p>
                  <p className="pl-3 text-[#d4ff32]">VITE_SUPABASE_URL = your-supabase-project-url</p>
                  <p className="pl-3 text-[#d4ff32]">VITE_SUPABASE_ANON_KEY = your-supabase-anon-key</p>
                  <p>3. Redeploy on Vercel to activate instant global cloud queries!</p>
                </div>
              )}
            </div>
          )}

          {/* User Search Input Box */}
          <div className="p-5 rounded-2xl bg-black/60 border border-emerald-900/40 backdrop-blur-md shadow-inner space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono flex items-center gap-1.5 text-neutral-300">
                <Ghost className="w-3.5 h-3.5 text-[#d4ff32]" />
                Search by Hauntly ID, UUID or @Username
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">e.g. #HAUNT-8X29K, 8X29K, @dracula</span>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ENTER HAUNTLY ID, CODE OR @USERNAME"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-700/60 text-white placeholder-neutral-500 font-mono text-xs tracking-wider focus:outline-none focus:border-[#d4ff32] focus:ring-1 focus:ring-[#d4ff32] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-neutral-600/50 shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-[#d4ff32]" />
                )}
                <span>Search</span>
              </button>
            </form>

            {/* Status / Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* No match found message with helpful tips & 1-click fallback summon */}
            {searchDone && !searchedProfile && !isSearching && !errorMsg && (
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-amber-500/30 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>No spirit currently cached matching &quot;{searchQuery}&quot;</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  If this is your friend&apos;s ID on their device, you can summon them directly to begin whispering:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const companion = createCompanionFromId(searchQuery);
                    setSearchedProfile(companion);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,255,50,0.3)]"
                >
                  <Ghost className="w-3.5 h-3.5" />
                  <span>Summon &amp; Whisper with #{searchQuery.trim().toUpperCase().replace(/^#/, '')}</span>
                </button>
              </div>
            )}

            {/* Searched Spirit Preview Card */}
            {searchDone && searchedProfile && (
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-[#d4ff32]/30 space-y-3 animate-fadeIn shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {searchedProfile.avatar_url ? (
                      <img
                        src={searchedProfile.avatar_url}
                        alt={searchedProfile.display_name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#d4ff32]/60 shadow-[0_0_12px_rgba(212,255,50,0.3)]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-[#d4ff32]/40 flex items-center justify-center text-white font-bold text-lg">
                        {searchedProfile.display_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {searchedProfile.display_name}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        @{searchedProfile.username}
                      </div>
                      <div className="mt-1">
                        <HauntlyIdBadge hauntlyId={searchedProfile.hauntly_id} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Instant 1-on-1 Whisper Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isStartingChat || searchedProfile.id === currentUserId}
                      onClick={() => handleStartWhisper(searchedProfile)}
                      className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      title={searchedProfile.id === currentUserId ? 'This is yourself' : 'Start direct whisper conversation'}
                    >
                      {isStartingChat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      <span>Start Whisper</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              INTERNET ACCESS: YOUR PERMANENT INVITE LINK & HAUNTLY ID
          ══════════════════════════════════════════════════════════════════ */}
          {myProfile && (
            <div className="p-5 rounded-2xl bg-[#08120b]/90 border border-emerald-900/50 backdrop-blur-md shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4ff32]" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Share Your Link Across The Internet
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  Instant Web Connect
                </span>
              </div>

              <p className="text-xs text-neutral-300/80 leading-relaxed">
                Send your permanent link to friends on WhatsApp, Discord, or Instagram. When they open it, your profile will be ready to whisper instantly!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Permanent ID Card */}
                <div className="p-3 rounded-xl bg-black/60 border border-emerald-950 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase">Your Hauntly ID</span>
                    <span className="text-xs font-mono font-bold text-[#d4ff32] truncate block">
                      #{myProfile.hauntly_id.toLowerCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMyId}
                    className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy Hauntly ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#d4ff32]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 2. Permanent Invite Link */}
                <div className="p-3 rounded-xl bg-black/60 border border-emerald-950 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase">Direct Whisper Link</span>
                    <span className="text-xs font-mono text-emerald-400 truncate block">
                      {getInviteUrl().replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy Direct Link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-[#d4ff32]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareInvite}
                      className="p-2 rounded-lg bg-[#d4ff32] hover:bg-[#bbf019] text-black transition-colors cursor-pointer"
                      title="Share link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
