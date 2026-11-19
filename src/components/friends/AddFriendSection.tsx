import React, { useState } from 'react';
import type { Profile, RelationshipStatus } from '../../types/profile';
import { searchByHauntlyId } from '../../lib/profileService';
import { sendFriendRequest, getRelationshipStatus } from '../../lib/friendsService';
import { GothicInput } from '../ui/GothicInput';
import { GothicButton } from '../ui/GothicButton';
import { GothicBadge } from '../ui/GothicBadge';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Calendar,
  ShieldCheck,
  Ghost,
} from 'lucide-react';

interface AddFriendSectionProps {
  currentUserId: string;
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSearching(true);
    setSearchDone(false);
    setSearchedProfile(null);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ancient time';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar Container */}
      <div className="p-6 rounded-2xl bg-[#0b0514]/90 border border-purple-900/50 shadow-[0_0_30px_rgba(147,51,234,0.15)] space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            Summon Friend by Hauntly ID
          </h3>
          <p className="text-xs text-purple-300/70">
            Enter a friend&apos;s unique, permanent Hauntly ID (e.g.{' '}
            <span className="font-mono text-purple-300 font-semibold">HAUNT-8X29K</span>) to inspect their spirit profile and initiate a pact.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <GothicInput
              type="text"
              placeholder="e.g. HAUNT-8X29K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              leftIcon={<Ghost className="w-4 h-4 text-purple-400" />}
            />
          </div>
          <GothicButton
            type="submit"
            variant="primary"
            size="md"
            disabled={!searchQuery.trim() || isSearching}
            leftIcon={isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          >
            {isSearching ? 'Searching...' : 'Locate Soul'}
          </GothicButton>
        </form>

        {/* Ethereal Tip */}
        <div className="flex items-center gap-2 text-[11px] text-purple-400/60 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Hauntly IDs are permanent, private, and guarantee zero exposure of personal email addresses.</span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Result Profile Card */}
      {searchDone && (
        <div className="animate-fadeIn">
          {searchedProfile ? (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#130922] via-[#0d0617] to-[#07030e] border border-purple-700/60 shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-purple-900/40">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {searchedProfile.avatar_url ? (
                      <img
                        src={searchedProfile.avatar_url}
                        alt={searchedProfile.display_name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/70 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-950 border-2 border-purple-500/60 flex items-center justify-center text-purple-200 text-2xl font-serif font-black shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                        {searchedProfile.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-serif font-bold text-white">
                        {searchedProfile.display_name}
                      </h4>
                      <span className="text-xs font-mono text-purple-400/80">
                        @{searchedProfile.username}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-purple-300/70">
                      <HauntlyIdBadge hauntlyId={searchedProfile.hauntly_id} size="sm" />
                      <span className="flex items-center gap-1 font-mono text-[11px] text-purple-400/60">
                        <Calendar className="w-3 h-3" />
                        Bound {formatDate(searchedProfile.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relationship status badge */}
                <div>
                  {relationship === 'self' && (
                    <GothicBadge variant="amber" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                      YOUR OWN VESSEL
                    </GothicBadge>
                  )}
                  {relationship === 'friends' && (
                    <GothicBadge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                      IN YOUR COVEN CIRCLE
                    </GothicBadge>
                  )}
                  {relationship === 'pending_sent' && (
                    <GothicBadge variant="purple" icon={<Clock className="w-3.5 h-3.5" />}>
                      REQUEST DISPATCHED
                    </GothicBadge>
                  )}
                  {relationship === 'pending_received' && (
                    <GothicBadge variant="amber" icon={<Sparkles className="w-3.5 h-3.5" />}>
                      HAS SUMMONED YOU
                    </GothicBadge>
                  )}
                  {relationship === 'blocked' && (
                    <GothicBadge variant="rose" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                      BANISHED
                    </GothicBadge>
                  )}
                  {relationship === 'none' && (
                    <GothicBadge variant="obsidian" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                      AVAILABLE TO CONNECT
                    </GothicBadge>
                  )}
                </div>
              </div>

              {/* Spectral Lore / Bio */}
              {searchedProfile.bio && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-200/90 italic">
                  &ldquo;{searchedProfile.bio}&rdquo;
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-purple-400/60">
                  {relationship === 'self'
                    ? 'You cannot send a friend request to your own soul.'
                    : relationship === 'friends'
                    ? 'You and this spirit are already bonded friends.'
                    : relationship === 'pending_sent'
                    ? 'Your summoning is awaiting their spectral acceptance.'
                    : relationship === 'pending_received'
                    ? 'Check your Pending Requests tab to accept their pact.'
                    : 'Send a request to welcome this spirit into your circle.'}
                </span>

                {relationship === 'none' && (
                  <GothicButton
                    variant="primary"
                    size="md"
                    onClick={handleSendRequest}
                    disabled={isSending}
                    leftIcon={
                      isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )
                    }
                  >
                    {isSending ? 'Dispatching...' : 'Send Friend Request'}
                  </GothicButton>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
                <Ghost className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-serif font-bold text-white">No Spectral Match Discovered</h4>
              <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                No wanderer in the shadows bears the identifier <span className="font-mono text-purple-200 font-semibold">{searchQuery}</span>. Verify the code with your companion.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
