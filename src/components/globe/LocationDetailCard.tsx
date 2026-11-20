import React, { useState } from 'react';
import {
  X,
  MapPin,
  Compass,
  Copy,
  Check,
  Calendar,
  MessageSquare,
  Navigation,
} from 'lucide-react';
import type { GroupLocation } from '../../types/globe';
import { useNavigate } from 'react-router-dom';

interface LocationDetailCardProps {
  location: GroupLocation;
  onClose: () => void;
  onFlyTo?: (loc: GroupLocation) => void;
}

const CATEGORY_COLORS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  sanctuary: {
    label: 'Sanctuary',
    bg: 'bg-purple-950/80',
    text: 'text-purple-300',
    border: 'border-purple-600/50',
  },
  crypt: {
    label: 'Crypt & Tomb',
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-600/50',
  },
  coven_hall: {
    label: 'Coven Hall',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-600/50',
  },
  historic: {
    label: 'Historic Relic',
    bg: 'bg-indigo-950/80',
    text: 'text-indigo-300',
    border: 'border-indigo-600/50',
  },
  observatory: {
    label: 'Nocturnal Observatory',
    bg: 'bg-cyan-950/80',
    text: 'text-cyan-300',
    border: 'border-cyan-600/50',
  },
  gathering: {
    label: 'Gathering Point',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-600/50',
  },
};

export const LocationDetailCard: React.FC<LocationDetailCardProps> = ({
  location,
  onClose,
  onFlyTo,
}) => {
  const navigate = useNavigate();
  const [copiedCoords, setCopiedCoords] = useState(false);

  const coordsString = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  const catStyle = CATEGORY_COLORS[location.category] || CATEGORY_COLORS.sanctuary;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(coordsString);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleDiscussInChat = () => {
    navigate('/chat');
  };

  const suggestedName = location.suggested_by_profile?.display_name || 'Coven Spirit';
  const suggestedAvatar =
    location.suggested_by_profile?.avatar_url || '/chat/avatar_designers_hero.png';
  const suggestedHauntlyId = location.suggested_by_profile?.hauntly_id;

  return (
    <div
      className="w-full max-w-sm sm:max-w-md rounded-2xl border border-purple-600/40 p-5 text-white shadow-[0_0_35px_rgba(147,51,234,0.35)] backdrop-blur-xl animate-fadeIn relative z-30"
      style={{
        background:
          'linear-gradient(135deg, rgba(22, 8, 48, 0.94) 0%, rgba(12, 4, 26, 0.96) 100%)',
      }}
    >
      {/* Header with Category Badge & Close */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${catStyle.bg} ${catStyle.text} ${catStyle.border} shadow-[0_0_10px_rgba(168,85,247,0.25)]`}
          >
            {catStyle.label}
          </span>
          {location.is_selected && (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              ⭐ Chosen Sanctuary
            </span>
          )}
          {!location.is_selected && location.leading_location && (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-950/80 border border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              👑 Leading Choice
            </span>
          )}
          {typeof location.vote_count === 'number' && location.vote_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-900/60 border border-purple-600/40 text-purple-200">
              {location.vote_count} {location.vote_count === 1 ? 'vote' : 'votes'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-purple-950/70 hover:bg-purple-800/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Place Title */}
      <h3 className="text-base sm:text-lg font-serif font-black text-white tracking-wide leading-snug mb-1">
        {location.name}
      </h3>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-purple-300/80 mb-3 leading-relaxed">
        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
        <span>{location.address}</span>
      </div>

      {/* Description */}
      {location.description && (
        <p className="text-xs text-purple-200/70 leading-relaxed mb-4 bg-purple-950/40 border border-purple-900/40 rounded-xl p-3">
          {location.description}
        </p>
      )}

      {/* Coordinates Block with Copy Action */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#090214] border border-purple-900/60 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-purple-400/60 font-semibold">
              Ethereal Coordinates
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {coordsString}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyCoords}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-[11px] text-purple-300 transition-colors cursor-pointer"
          title="Copy coordinates"
        >
          {copiedCoords ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Suggested By Section */}
      <div className="flex items-center justify-between pt-2 border-t border-purple-900/40 text-xs mb-4">
        <div className="flex items-center gap-2">
          <img
            src={suggestedAvatar}
            alt={suggestedName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-500/50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
            }}
          />
          <div>
            <span className="text-[10px] text-purple-400/60 block">Summoned by</span>
            <span className="font-semibold text-purple-200 text-xs">
              {suggestedName}
              {suggestedHauntlyId && (
                <span className="text-[10px] text-purple-400/70 font-mono ml-1">
                  #{suggestedHauntlyId.toLowerCase().slice(0, 9)}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-purple-400/60 font-mono">
          <Calendar className="w-3 h-3" />
          <span>{new Date(location.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onFlyTo && (
          <button
            type="button"
            onClick={() => onFlyTo(location)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Fly Camera Here</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleDiscussInChat}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discuss in Coven</span>
        </button>
      </div>
    </div>
  );
};
