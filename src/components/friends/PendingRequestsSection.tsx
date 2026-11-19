import React, { useState } from 'react';
import type { Friendship } from '../../types/profile';
import {
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
} from '../../lib/friendsService';
import { GothicButton } from '../ui/GothicButton';
import { GothicBadge } from '../ui/GothicBadge';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Inbox,
  Send,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ghost,
} from 'lucide-react';

interface PendingRequestsSectionProps {
  currentUserId: string;
  receivedRequests: Friendship[];
  sentRequests: Friendship[];
  onRefresh: () => void;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffMs = Math.max(0, Date.now() - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

export const PendingRequestsSection: React.FC<PendingRequestsSectionProps> = ({
  currentUserId,
  receivedRequests,
  sentRequests,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAccept = async (req: Friendship) => {
    setProcessingId(req.id);
    setActionNotice(null);
    try {
      const { error } = await acceptFriendRequest(req.id, currentUserId);
      if (error) {
        setActionNotice({ type: 'error', message: error.message });
      } else {
        const name = req.requester?.display_name || 'Spirit';
        setActionNotice({ type: 'success', message: `Friendship pact sealed with ${name}!` });
        onRefresh();
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to accept friend request.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: Friendship) => {
    setProcessingId(req.id);
    setActionNotice(null);
    try {
      const { error } = await rejectFriendRequest(req.id, currentUserId);
      if (error) {
        setActionNotice({ type: 'error', message: error.message });
      } else {
        setActionNotice({ type: 'success', message: 'Friend request declined.' });
        onRefresh();
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to reject friend request.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (req: Friendship) => {
    setProcessingId(req.id);
    setActionNotice(null);
    try {
      const { error } = await cancelFriendRequest(req.id, currentUserId);
      if (error) {
        setActionNotice({ type: 'error', message: error.message });
      } else {
        setActionNotice({ type: 'success', message: 'Dispatched friend request rescinded.' });
        onRefresh();
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to cancel request.',
      });
    } finally {
      setProcessingId(null);
    }
  };



  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-3 border-b border-purple-950 pb-3">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'received'
              ? 'bg-purple-950/80 text-white border border-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-purple-400/60 hover:text-purple-200 hover:bg-purple-950/30'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Received Invocations</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              receivedRequests.length > 0
                ? 'bg-purple-600 text-white font-bold animate-pulse'
                : 'bg-purple-950 text-purple-400/60'
            }`}
          >
            {receivedRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-purple-950/80 text-white border border-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'text-purple-400/60 hover:text-purple-200 hover:bg-purple-950/30'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Dispatched Summons</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-400/60">
            {sentRequests.length}
          </span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Received Requests List */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {receivedRequests.map((req) => {
                const requester = req.requester;
                if (!requester) return null;
                const isBusy = processingId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0d0718]/90 border border-purple-900/40 hover:border-purple-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {requester.avatar_url ? (
                          <img
                            src={requester.avatar_url}
                            alt={requester.display_name}
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-purple-200 text-lg font-serif font-black">
                            {requester.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-serif font-bold text-white">
                            {requester.display_name}
                          </h4>
                          <span className="text-xs font-mono text-purple-400/80">
                            @{requester.username}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <HauntlyIdBadge hauntlyId={requester.hauntly_id} size="sm" />
                          <span className="text-[11px] font-mono text-purple-400/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(req.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <GothicButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(req)}
                        disabled={isBusy}
                        leftIcon={<UserX className="w-3.5 h-3.5 text-rose-400" />}
                        className="text-rose-300 hover:text-white hover:bg-rose-950/60"
                      >
                        Decline
                      </GothicButton>

                      <GothicButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(req)}
                        disabled={isBusy}
                        leftIcon={
                          isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        Accept Pact
                      </GothicButton>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-2">
              <Ghost className="w-10 h-10 mx-auto text-purple-400/50" />
              <h4 className="text-sm font-serif font-bold text-white">The Crypt is Silent</h4>
              <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                No souls have requested a bond with your spirit yet. Share your Hauntly ID with companions to summon requests.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sent Requests List */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {sentRequests.map((req) => {
                const addressee = req.addressee;
                if (!addressee) return null;
                const isBusy = processingId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#0d0718]/90 border border-purple-900/40 hover:border-purple-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {addressee.avatar_url ? (
                          <img
                            src={addressee.avatar_url}
                            alt={addressee.display_name}
                            className="w-12 h-12 rounded-xl object-cover border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-purple-200 text-lg font-serif font-black">
                            {addressee.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-serif font-bold text-white">
                            {addressee.display_name}
                          </h4>
                          <span className="text-xs font-mono text-purple-400/80">
                            @{addressee.username}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <HauntlyIdBadge hauntlyId={addressee.hauntly_id} size="sm" />
                          <GothicBadge variant="purple" icon={<Clock className="w-2.5 h-2.5" />}>
                            Sent {formatTimeAgo(req.created_at)}
                          </GothicBadge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="self-end sm:self-center">
                      <GothicButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(req)}
                        disabled={isBusy}
                        leftIcon={
                          isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-purple-400" />
                          )
                        }
                        className="text-purple-300 hover:text-rose-300 hover:bg-purple-950/40"
                      >
                        Rescind Request
                      </GothicButton>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-2">
              <Send className="w-10 h-10 mx-auto text-purple-400/50" />
              <h4 className="text-sm font-serif font-bold text-white">No Dispatched Invocations</h4>
              <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
                You have no active requests wandering the ether. Use &quot;Add Friend by ID&quot; to summon new companions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
