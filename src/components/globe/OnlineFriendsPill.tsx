import React, { useState } from 'react';
import { Users, Navigation, X, MessageSquare } from 'lucide-react';
import type { FriendPin } from '../../types/globe';
import { useNavigate } from 'react-router-dom';

interface OnlineFriendsPillProps {
  friends: FriendPin[];
  onFlyToFriend: (friend: FriendPin) => void;
}

export const OnlineFriendsPill: React.FC<OnlineFriendsPillProps> = ({
  friends,
  onFlyToFriend,
}) => {
  const [trayOpen, setTrayOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-30 select-none">
      {/* ── Glassmorphic Pill Button ── */}
      <button
        type="button"
        onClick={() => setTrayOpen(!trayOpen)}
        className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full border border-purple-500/40 hover:border-purple-400 bg-[#16092c]/80 hover:bg-[#200c3f]/90 text-white backdrop-blur-xl transition-all cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)]"
        title="View online coven friends across the world"
      >
        <Users className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
        <span className="text-xs font-semibold tracking-wide text-purple-100">
          {friends.length} Friends Online
        </span>
        {/* Neon Purple Breathing Indicator Dot */}
        <span className="relative flex h-2.5 w-2.5 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500 shadow-[0_0_10px_#c084fc]" />
        </span>
      </button>

      {/* ── Slide-up Online Friends Tray ── */}
      {trayOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-80 sm:w-88 rounded-3xl border border-purple-600/50 bg-[#120524]/95 backdrop-blur-2xl p-4 shadow-[0_10px_45px_rgba(0,0,0,0.8),0_0_30px_rgba(147,51,234,0.35)] animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Spirits Online in Realm
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setTrayOpen(false)}
              className="w-6 h-6 rounded-full bg-purple-950/70 hover:bg-purple-800/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Friends List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-900/40">
            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2 rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900/30 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={f.avatar_url}
                      alt={f.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-400/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
                      }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 ring-2 ring-[#120524] shadow-[0_0_6px_#c084fc]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate block">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-purple-400/60 font-mono">
                        @{f.handle}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-300/80 block truncate">
                      📍 {f.city}{f.country ? `, ${f.country}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFlyToFriend(f);
                      setTrayOpen(false);
                    }}
                    className="p-1.5 rounded-xl bg-purple-800/60 hover:bg-purple-700/80 text-purple-200 hover:text-white transition-all cursor-pointer shadow-sm"
                    title={`Fly camera to ${f.name} in ${f.city}`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    className="p-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-800/70 text-purple-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    title={`Whisper to ${f.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
