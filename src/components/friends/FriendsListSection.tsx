import React, { useState } from 'react';
import type { FriendEntry } from '../../types/profile';
import { removeFriend, blockUser } from '../../lib/friendsService';
import { GothicButton } from '../ui/GothicButton';
import { GothicInput } from '../ui/GothicInput';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Users,
  Search,
  MessageSquare,
  UserMinus,
  Ban,
  Calendar,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ghost,
  Sparkles,
} from 'lucide-react';

interface FriendsListSectionProps {
  currentUserId: string;
  friends: FriendEntry[];
  onRefresh: () => void;
  onNavigateToAddFriend: () => void;
}

export const FriendsListSection: React.FC<FriendsListSectionProps> = ({
  currentUserId,
  friends,
  onRefresh,
  onNavigateToAddFriend,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFriendToAct, setSelectedFriendToAct] = useState<{
    entry: FriendEntry;
    action: 'remove' | 'block';
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredFriends = friends.filter((entry) => {
    const q = filterQuery.toLowerCase();
    const p = entry.friend;
    return (
      p.display_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.hauntly_id.toLowerCase().includes(q)
    );
  });

  const handleConfirmAction = async () => {
    if (!selectedFriendToAct) return;
    const { entry, action } = selectedFriendToAct;
    setIsProcessing(true);
    setActionNotice(null);

    try {
      if (action === 'remove') {
        const { error } = await removeFriend(entry.friendshipId, currentUserId);
        if (error) {
          setActionNotice({ type: 'error', message: error.message });
        } else {
          setActionNotice({
            type: 'success',
            message: `${entry.friend.display_name} has been released from your Coven.`,
          });
          onRefresh();
        }
      } else if (action === 'block') {
        const { error } = await blockUser(currentUserId, entry.friend.id);
        if (error) {
          setActionNotice({ type: 'error', message: error.message });
        } else {
          setActionNotice({
            type: 'success',
            message: `${entry.friend.display_name} has been banished and blocked.`,
          });
          onRefresh();
        }
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed across the ethereal realm.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedFriendToAct(null);
      setActiveMenuId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <GothicInput
            type="text"
            placeholder="Filter coven companions by name, @handle or ID..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-purple-400" />}
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-purple-400/70">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {friends.length} {friends.length === 1 ? 'Spirit' : 'Spirits'} in Coven
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800/60 text-rose-300'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Friends Cards Grid */}
      {filteredFriends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFriends.map((entry) => {
            const friend = entry.friend;
            const isMenuOpen = activeMenuId === entry.friendshipId;

            return (
              <div
                key={entry.friendshipId}
                className="relative p-5 rounded-2xl bg-[#0e071a]/90 border border-purple-900/50 hover:border-purple-600/60 transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.6)] flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.display_name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-950 border-2 border-purple-500/60 flex items-center justify-center text-purple-200 text-xl font-serif font-black shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                          {friend.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0e071a] flex items-center justify-center" title="Soul Active">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif font-bold text-white group-hover:text-purple-200 transition-colors">
                          {friend.display_name}
                        </h4>
                        <span className="text-xs font-mono text-purple-400/70">
                          @{friend.username}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <HauntlyIdBadge hauntlyId={friend.hauntly_id} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Context Options Dropdown Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(isMenuOpen ? null : entry.friendshipId)}
                      className="w-8 h-8 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Spectral options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-10 w-44 rounded-xl bg-[#140b24] border border-purple-800/60 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-20 space-y-1 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFriendToAct({ entry, action: 'remove' });
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-purple-200 hover:bg-purple-900/40 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                          <span>Sever Pact (Remove)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFriendToAct({ entry, action: 'block' });
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>Banish & Block</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio / Quote if exists */}
                {friend.bio && (
                  <p className="text-xs text-purple-300/80 italic line-clamp-2">
                    &ldquo;{friend.bio}&rdquo;
                  </p>
                )}

                {/* Footer details & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-900/30 text-[11px] text-purple-400/60 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Bonded {formatDate(entry.createdAt)}
                  </span>

                  <a
                    href="#chat"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-800/80 border border-purple-700/50 text-purple-200 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                    <span>Whisper</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : friends.length > 0 ? (
        <div className="p-8 rounded-2xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-2">
          <Ghost className="w-8 h-8 mx-auto text-purple-400/50" />
          <h4 className="text-sm font-serif font-bold text-white">No Companions Found</h4>
          <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
            No spirit matching &quot;{filterQuery}&quot; was located in your current circle.
          </p>
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-950/70 border border-purple-700/50 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-serif font-bold text-white">Your Coven Circle is Solitary</h4>
            <p className="text-xs sm:text-sm text-purple-300/60 max-w-md mx-auto">
              No spirits walk beside you in the shadows yet. Summon friends by their Hauntly ID or share your own soul seal to unite.
            </p>
          </div>
          <GothicButton
            variant="primary"
            size="md"
            onClick={onNavigateToAddFriend}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Add Friend by ID
          </GothicButton>
        </div>
      )}

      {/* Confirmation Modal for Remove / Block */}
      {selectedFriendToAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0e071a] border border-purple-800/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 mx-auto">
              {selectedFriendToAct.action === 'remove' ? (
                <UserMinus className="w-6 h-6" />
              ) : (
                <Ban className="w-6 h-6" />
              )}
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-serif font-black text-white">
                {selectedFriendToAct.action === 'remove' ? 'Sever Friendship Pact?' : 'Banish Spirit (Block)?'}
              </h3>
              <p className="text-xs text-purple-200/70">
                {selectedFriendToAct.action === 'remove'
                  ? `Are you certain you wish to remove ${selectedFriendToAct.entry.friend.display_name} from your Coven Circle?`
                  : `Are you certain you wish to block ${selectedFriendToAct.entry.friend.display_name}? They will no longer be able to summon you or view your vessel.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/40">
              <GothicButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFriendToAct(null)}
                disabled={isProcessing}
              >
                Retain
              </GothicButton>
              <GothicButton
                variant="danger"
                size="sm"
                onClick={handleConfirmAction}
                disabled={isProcessing}
                leftIcon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isProcessing
                  ? 'Executing...'
                  : selectedFriendToAct.action === 'remove'
                  ? 'Confirm Severance'
                  : 'Confirm Banishment'}
              </GothicButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
