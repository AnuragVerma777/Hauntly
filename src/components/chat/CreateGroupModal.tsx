import React, { useState } from 'react';
import { X, Users, Loader2, Sparkles, Check } from 'lucide-react';
import type { FriendEntry } from '../../types/profile';
import { createGroup } from '../../lib/groupChatService';
import type { Group } from '../../types/groupChat';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  friends: FriendEntry[];
  onGroupCreated: (newGroup: Group) => void;
}

const COVEN_AVATARS = [
  { id: 'hero', src: '/chat/avatar_designers_hero.png', label: 'Coven Moon' },
  { id: 'pumpkin', src: '/avatar_witch_pumpkin.png', label: 'Witch Pumpkin' },
  { id: 'ghost', src: '/avatar_cute_ghost.png', label: 'Cute Ghost' },
  { id: 'cat', src: '/avatar_black_cat.png', label: 'Black Cat' },
  { id: 'skull', src: '/avatar_skull.png', label: 'Skull' },
  { id: 'castle', src: '/chat/photo_castle.png', label: 'Haunted Castle' },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  friends,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(COVEN_AVATARS[0].src);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a group name.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    const { data, error } = await createGroup(
      name.trim(),
      description.trim() || null,
      selectedAvatar,
      creatorId,
      selectedFriendIds
    );

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      onGroupCreated(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl border border-purple-700/50 p-6 overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(124,58,237,0.35)]"
        style={{
          background: 'linear-gradient(135deg, #130626 0%, #0c031a 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-600/50 flex items-center justify-center text-purple-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white">Form a New Coven</h3>
              <p className="text-[11px] text-purple-300/60">Create a group chat room for your spirits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto py-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Shadow Alchemists"
              maxLength={40}
              required
              className="w-full bg-[#180a32] text-xs text-white placeholder-purple-400/40 rounded-xl px-3.5 py-2.5 border border-purple-800/40 focus:border-purple-500 outline-none transition-all font-medium"
            />
          </div>

          {/* Group Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What mysteries are whispered in this circle?"
              maxLength={150}
              rows={2}
              className="w-full bg-[#180a32] text-xs text-white placeholder-purple-400/40 rounded-xl px-3.5 py-2.5 border border-purple-800/40 focus:border-purple-500 outline-none transition-all resize-none font-medium"
            />
          </div>

          {/* Choose Group Icon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white">Coven Crest</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {COVEN_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.src)}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer relative ${
                    selectedAvatar === av.src
                      ? 'border-purple-400 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                      : 'border-purple-900/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                  {selectedAvatar === av.src && (
                    <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Invite Friends */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Add Companions</label>
              <span className="text-[10px] text-purple-400/60 font-mono">
                {selectedFriendIds.length} selected
              </span>
            </div>

            {friends.length === 0 ? (
              <p className="text-[11px] text-purple-400/50 italic py-2">
                No companions in your friends list yet. You can still form the group and add members later!
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-purple-900/40">
                {friends.map((f) => {
                  const isChecked = selectedFriendIds.includes(f.friend.id);
                  return (
                    <button
                      key={f.friend.id}
                      type="button"
                      onClick={() => toggleFriend(f.friend.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-purple-900/50 border-purple-500/60'
                          : 'bg-[#15082c]/40 border-purple-900/30 hover:bg-purple-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={f.friend.avatar_url || '/hauntly-icon.png'}
                          alt={f.friend.display_name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/30"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{f.friend.display_name}</p>
                          <p className="text-[10px] text-purple-300/60 font-mono">
                            @{f.friend.username}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'border-purple-700/60 bg-purple-950/50'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-40 text-white text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Binding Coven...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Awaken Group Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
