import React, { useState } from 'react';
import type { BlockRecord } from '../../types/profile';
import { unblockUser } from '../../lib/friendsService';
import { GothicButton } from '../ui/GothicButton';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import {
  Ban,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface BlockedUsersSectionProps {
  currentUserId: string;
  blockedUsers: BlockRecord[];
  onRefresh: () => void;
}

export const BlockedUsersSection: React.FC<BlockedUsersSectionProps> = ({
  currentUserId,
  blockedUsers,
  onRefresh,
}) => {
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUnblock = async (rec: BlockRecord) => {
    setUnblockingId(rec.blocked_id);
    setActionNotice(null);
    try {
      const { error } = await unblockUser(currentUserId, rec.blocked_id);
      if (error) {
        setActionNotice({ type: 'error', message: error.message });
      } else {
        const name = rec.blocked_profile?.display_name || 'Spirit';
        setActionNotice({ type: 'success', message: `Banishment lifted for ${name}.` });
        onRefresh();
      }
    } catch (err: unknown) {
      setActionNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to unblock spirit.',
      });
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs text-purple-300/80 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0" />
        <span>
          Banished spirits cannot locate your vessel, inspect your Hauntly ID, or dispatch friendship requests to you.
        </span>
      </div>

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

      {blockedUsers.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {blockedUsers.map((rec) => {
            const profile = rec.blocked_profile;
            if (!profile) return null;
            const isBusy = unblockingId === rec.blocked_id;

            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-[#0d0718]/90 border border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative opacity-60">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-800/50 grayscale"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400 text-lg font-serif">
                        {profile.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-serif font-bold text-white line-through decoration-rose-500/70">
                        {profile.display_name}
                      </h4>
                      <span className="text-xs font-mono text-purple-400/60">
                        @{profile.username}
                      </span>
                    </div>

                    <HauntlyIdBadge hauntlyId={profile.hauntly_id} size="sm" />
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <GothicButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(rec)}
                    disabled={isBusy}
                    leftIcon={isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                    className="text-purple-300 hover:text-emerald-300 hover:bg-emerald-950/30"
                  >
                    {isBusy ? 'Lifting...' : 'Lift Banishment'}
                  </GothicButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#090412]/80 border border-purple-900/40 text-center space-y-2">
          <Ban className="w-9 h-9 mx-auto text-purple-400/40" />
          <h4 className="text-sm font-serif font-bold text-white">No Souls Banished</h4>
          <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
            You have not cast any wandering spirits into exile.
          </p>
        </div>
      )}
    </div>
  );
};
