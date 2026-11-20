import React, { useState } from 'react';
import type { Profile, RelationshipStatus } from '../../types/profile';
import { searchByHauntlyId } from '../../lib/profileService';
import { sendFriendRequest, getRelationshipStatus } from '../../lib/friendsService';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Ghost,
} from 'lucide-react';

interface AddFriendSectionProps {
  currentUserId: string;
  friendCount?: number;
  onNavigateToFriends?: () => void;
  onRequestSent?: () => void;
}

export const AddFriendSection: React.FC<AddFriendSectionProps> = ({
  currentUserId,
  onRequestSent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedProfile, setSearchedProfile] = useState<Profile | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [relationship, setRelationship] = useState<RelationshipStatus>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLifted, setIsLifted] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSearching(true);
    setSearchDone(false);
    setSearchedProfile(null);

    // Trigger pumpkin lift on search
    setIsLifted(true);

    try {
      const { data, error } = await searchByHauntlyId(query);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSearchedProfile(data);
        if (data) {
          const rel = await getRelationshipStatus(currentUserId, data.id);
          setRelationship(rel);
        }
      }
      setSearchDone(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Search failed across the ethereal plane.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchedProfile) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSending(true);

    // Ensure pumpkin is held aloft in celebration
    setIsLifted(true);

    try {
      const { error } = await sendFriendRequest(currentUserId, searchedProfile.id);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(`Friend request successfully sent to ${searchedProfile.display_name}!`);
        setRelationship('pending_sent');
        if (onRequestSent) onRequestSent();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send friend request.');
    } finally {
      setIsSending(false);
    }
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
              Coven Invitation Ritual
            </span>
          </div>
        </div>

        {/* Main Content: Hero Typography & Friend Summon Input */}
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
                    YOU&apos;RE ON THE <br />
                    <span className="text-[#d4ff32] drop-shadow-[0_0_20px_rgba(212,255,50,0.4)]">
                      HAUNT LIST
                    </span>
                  </h2>
                  <p className="text-sm text-neutral-400 font-sans max-w-md leading-relaxed mx-auto sm:mx-0">
                    One night, endless scares, and a party. Dress up and let the madness begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif uppercase tracking-tight text-white leading-none">
                    ONE NIGHT YOU&apos;LL <br />
                    <span className="text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                      NEVER FORGET
                    </span>
                  </h2>
                  <p className="text-sm text-neutral-300 font-sans max-w-md leading-relaxed mx-auto sm:mx-0">
                    A little spooky, a little wild, and anything but ordinary. Bring your costume, we&apos;ll bring the chaos.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Friend Search Input Box */}
          <div className="p-5 rounded-2xl bg-black/60 border border-emerald-900/40 backdrop-blur-md shadow-inner space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono flex items-center gap-1.5 text-neutral-300">
                <Ghost className="w-3.5 h-3.5 text-[#d4ff32]" />
                Summon Friend by Hauntly ID
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">e.g. HAUNT-8X29K</span>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ENTER HAUNTLY ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900/90 border border-neutral-700/60 text-white placeholder-neutral-500 font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#d4ff32] focus:ring-1 focus:ring-[#d4ff32] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
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
                <span>Locate</span>
              </button>
            </form>

            {/* Status / Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Searched Friend Preview Card */}
            {searchDone && searchedProfile && (
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-[#d4ff32]/30 space-y-3 animate-fadeIn shadow-lg">
                <div className="flex items-center justify-between">
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

                  {/* Relationship action */}
                  <div>
                    {relationship === 'none' && (
                      <button
                        onClick={handleSendRequest}
                        disabled={isSending}
                        className="px-3.5 py-2 rounded-xl bg-[#d4ff32] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#bbf019] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,255,50,0.4)]"
                      >
                        {isSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>Send Request</span>
                      </button>
                    )}
                    {relationship === 'friends' && (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> In Coven
                      </span>
                    )}
                    {relationship === 'pending_sent' && (
                      <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Dispatched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
