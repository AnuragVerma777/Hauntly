import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Copy,
  Check,
  Calendar,
  ArrowLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import type { Group, GroupMember } from '../../types/groupChat';
import type { FriendEntry } from '../../types/profile';
import { addGroupMember } from '../../lib/groupChatService';

interface GroupInfoPanelProps {
  group: Group;
  members: GroupMember[];
  currentUserId: string;
  friends: FriendEntry[];
  onClose: () => void;
  onMembersUpdated: () => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({
  group,
  members,
  currentUserId,
  friends,
  onClose,
  onMembersUpdated,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const existingUserIds = new Set(members.map((m) => m.user_id));
  const candidateFriends = friends.filter((f) => !existingUserIds.has(f.friend.id));

  const handleAddMember = async (friendId: string) => {
    setAddingId(friendId);
    await addGroupMember(group.id, friendId, 'member');
    setAddingId(null);
    onMembersUpdated();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isAdmin = currentMember?.role === 'admin';

  return (
    <div
      className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-l border-purple-900/30 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-purple-900/30">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <h3 className="text-sm font-bold text-white tracking-wide">Group Info</h3>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-900/40">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)] mb-3 bg-purple-950">
            <img
              src={group.avatar_url || '/chat/avatar_designers_hero.png'}
              alt={group.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
              }}
            />
          </div>
          <h2 className="text-base font-bold text-white tracking-wide">{group.name}</h2>
          {group.description && (
            <p className="text-[11px] text-purple-300/70 mt-1.5 leading-relaxed max-w-[220px]">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-purple-400/60 mt-2 font-mono">
            <Calendar className="w-3 h-3" />
            <span>Formed {new Date(group.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Members Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Members</span>
              <span className="text-xs font-bold text-purple-400">{group.member_count || members.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && candidateFriends.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{showAddMember ? 'Cancel' : 'Add'}</span>
                </button>
              )}
              <button
                type="button"
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer"
              >
                <span>See all</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Add Member Dropdown */}
          {showAddMember && (
            <div className="p-2.5 rounded-xl bg-[#170a2f] border border-purple-700/40 space-y-2 animate-fadeIn">
              <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                Select friend to invite:
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {candidateFriends.map((f) => (
                  <button
                    key={f.friend.id}
                    type="button"
                    disabled={addingId === f.friend.id}
                    onClick={() => handleAddMember(f.friend.id)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-purple-900/40 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={f.friend.avatar_url || '/hauntly-icon.png'}
                        alt={f.friend.display_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-white truncate max-w-[120px]">
                        {f.friend.display_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-semibold">
                      {addingId === f.friend.id ? 'Adding...' : '+ Add'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-1.5">
            {members.slice(0, 5).map((m) => {
              const displayName = m.profile?.display_name || 'Spirit';
              const username = m.profile?.username || 'user';
              const hauntlyId = m.profile?.hauntly_id || '';
              const isMe = m.user_id === currentUserId;

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#14072b]/50 border border-purple-900/30 hover:border-purple-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.profile?.avatar_url || '/hauntly-icon.png'}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {displayName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] text-purple-300 bg-purple-900/60 px-1 rounded font-mono">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-purple-400/60 font-mono truncate">
                        <span>@{username}</span>
                        {hauntlyId && (
                          <button
                            type="button"
                            onClick={() => handleCopy(hauntlyId)}
                            title={`Copy ID ${hauntlyId}`}
                            className="hover:text-purple-200 transition-colors cursor-pointer ml-1 inline-flex items-center"
                          >
                            {copiedId === hauntlyId ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {m.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full shrink-0">
                      <Shield className="w-2.5 h-2.5" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded border border-purple-500/40 flex items-center justify-center shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared Photos Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Shared Photos</span>
              <span className="text-xs font-bold text-purple-400">126</span>
            </div>
            <button
              type="button"
              className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer"
            >
              <span>See all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { src: '/chat/photo_moon.png', alt: 'Nocturnal Moon' },
              { src: '/chat/photo_cat.png', alt: 'Spooky Familiar' },
              { src: '/chat/photo_castle.png', alt: 'Gothic Castle' },
              { src: '/chat/photo_ghost.png', alt: 'Ethereal Apparition' },
            ].map((photo, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden ring-1 ring-purple-800/40 hover:ring-purple-500/60 transition-all group relative cursor-pointer"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-purple-950/20 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Security & Encryption Notice */}
        <div
          className="p-3.5 rounded-2xl border border-purple-800/40 space-y-1.5"
          style={{ background: 'rgba(12,5,25,0.7)' }}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Row Level Security Fortified</span>
          </div>
          <p className="text-[10px] text-purple-300/60 leading-relaxed">
            Only confirmed members of {group.name} can view, transmit, or react to messages. All transmissions
            are cryptographically verified with PostgreSQL security policies.
          </p>
        </div>
      </div>
    </div>
  );
};
