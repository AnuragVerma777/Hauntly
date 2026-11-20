import React from 'react';
import { X, MessageSquare, Navigation, MapPin } from 'lucide-react';
import type { FriendPin } from '../../types/globe';
import { useNavigate } from 'react-router-dom';

interface FriendDetailCardProps {
  friend: FriendPin;
  onClose: () => void;
  onFlyTo?: (friend: FriendPin) => void;
}

export const FriendDetailCard: React.FC<FriendDetailCardProps> = ({
  friend,
  onClose,
  onFlyTo,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="w-full max-w-sm rounded-3xl border border-purple-500/50 p-4 text-white shadow-[0_10px_45px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.35)] backdrop-blur-2xl animate-fadeIn relative z-30"
      style={{
        background:
          'linear-gradient(135deg, rgba(24, 8, 52, 0.95) 0%, rgba(12, 4, 28, 0.98) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-[10px] font-bold tracking-wider uppercase text-purple-200">
          <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
          <span>Active Spirit Online</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-purple-950/70 hover:bg-purple-800/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Friend Profile */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0">
          <img
            src={friend.avatar_url}
            alt={friend.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
            }}
          />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-500 ring-2 ring-[#180834] shadow-[0_0_10px_#c084fc]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white tracking-wide truncate">
            {friend.name}
          </h3>
          <p className="text-[11px] text-purple-400/80 font-mono">
            @{friend.handle}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-purple-300/80 mt-0.5">
            <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="truncate">
              {friend.city}{friend.country ? `, ${friend.country}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Lore */}
      {friend.activity && (
        <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 text-[11px] text-purple-200/80 leading-relaxed mb-3">
          <span className="text-purple-400 font-semibold">Activity: </span>
          {friend.activity}
        </div>
      )}

      {/* Coordinates */}
      <div className="text-[10px] text-purple-400/60 font-mono mb-3 px-1 flex items-center justify-between">
        <span>Coordinates:</span>
        <span>
          {friend.latitude.toFixed(4)}° N, {friend.longitude.toFixed(4)}° E
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onFlyTo && (
          <button
            type="button"
            onClick={() => onFlyTo(friend)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Fly Camera</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Whisper in Chat</span>
        </button>
      </div>
    </div>
  );
};
