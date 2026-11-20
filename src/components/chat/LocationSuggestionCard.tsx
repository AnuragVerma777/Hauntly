import React, { useState, useEffect } from 'react';
import {
  Globe2,
  ThumbsUp,
  Crown,
  Navigation,
  Loader2,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { voteForLocation, fetchLocationVotes, selectFinalLocation } from '../../lib/locationSuggestionService';

interface LocationSuggestionCardProps {
  locationId: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
  groupId: string;
  currentUserId: string;
  isAdmin?: boolean;
  onViewOnGlobe?: (lat: number, lng: number, locationId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  sanctuary: '🏰',
  crypt: '⚰️',
  historic: '🏛️',
  coven_hall: '🕯️',
  observatory: '🌙',
  gathering: '👻',
};

export const LocationSuggestionCard: React.FC<LocationSuggestionCardProps> = ({
  locationId,
  name,
  address,
  description,
  latitude,
  longitude,
  category,
  groupId,
  currentUserId,
  isAdmin = false,
  onViewOnGlobe,
}) => {
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [leadingLocation, setLeadingLocation] = useState(false);

  // Fetch votes on mount
  useEffect(() => {
    let active = true;
    const loadVotes = async () => {
      const { data: votesMap } = await fetchLocationVotes(groupId, currentUserId);
      if (!active) return;

      const thisVote = votesMap.get(locationId);
      if (thisVote) {
        setVoteCount(thisVote.count);
        setHasVoted(thisVote.votedByUser);
      }

      // Determine if this is the leading location
      let maxVotes = 0;
      let maxId = '';
      for (const [id, v] of votesMap.entries()) {
        if (v.count > maxVotes) {
          maxVotes = v.count;
          maxId = id;
        }
      }
      setLeadingLocation(maxId === locationId && maxVotes > 0);

      // Check if this location is selected (from local storage in demo)
      try {
        const raw = localStorage.getItem('hauntly_local_group_locations');
        if (raw) {
          const locs = JSON.parse(raw);
          const found = locs.find((l: any) => l.id === locationId);
          if (found && found.is_selected) setIsSelected(true);
        }
      } catch {
        // ignore
      }
    };

    void loadVotes();

    // Listen for vote changes
    const handler = () => void loadVotes();
    window.addEventListener('hauntly_location_vote_changed', handler);
    window.addEventListener('hauntly_locations_update', handler);

    return () => {
      active = false;
      window.removeEventListener('hauntly_location_vote_changed', handler);
      window.removeEventListener('hauntly_locations_update', handler);
    };
  }, [locationId, groupId, currentUserId]);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    setIsVoting(true);

    // Optimistic update
    if (hasVoted) {
      setVoteCount((c) => Math.max(0, c - 1));
      setHasVoted(false);
    } else {
      setVoteCount((c) => c + 1);
      setHasVoted(true);
    }

    const { error } = await voteForLocation(locationId, currentUserId, groupId);
    if (error) {
      // Revert
      if (hasVoted) {
        setVoteCount((c) => c + 1);
        setHasVoted(true);
      } else {
        setVoteCount((c) => Math.max(0, c - 1));
        setHasVoted(false);
      }
    }

    setIsVoting(false);
  };

  const handleSelect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelecting || isSelected) return;
    setIsSelecting(true);

    const { error } = await selectFinalLocation(locationId, groupId, currentUserId);
    if (!error) {
      setIsSelected(true);
    }

    setIsSelecting(false);
  };

  const handleViewOnGlobe = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewOnGlobe?.(latitude, longitude, locationId);
  };

  const categoryIcon = CATEGORY_ICONS[category || 'sanctuary'] || '📍';
  const shortAddress = address.split(',').slice(0, 2).join(', ');

  return (
    <div
      className={`relative w-full max-w-[320px] rounded-2xl overflow-hidden border transition-all ${
        isSelected
          ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
          : leadingLocation
          ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border-purple-600/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, #064e3b 0%, #0d1f1e 100%)'
          : 'linear-gradient(135deg, #1e0a3c 0%, #150727 100%)',
      }}
    >
      {/* Selected / Leading Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 text-[9px] font-bold uppercase tracking-wider z-10">
          <CheckCircle2 className="w-3 h-3" />
          <span>Selected</span>
        </div>
      )}
      {!isSelected && leadingLocation && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[9px] font-bold uppercase tracking-wider z-10">
          <Trophy className="w-3 h-3" />
          <span>Leading</span>
        </div>
      )}

      {/* Map Preview Bar */}
      <div
        className="h-16 relative flex items-end px-3 pb-2"
        style={{
          background: `linear-gradient(to bottom, rgba(30, 10, 60, 0.3) 0%, rgba(21, 7, 39, 0.9) 100%), url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${longitude},${latitude},8,0/320x80?access_token=placeholder')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{categoryIcon}</span>
          <span className="text-[9px] font-semibold text-purple-200/70 uppercase tracking-wider">
            Location Suggestion
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-2.5">
        <div>
          <h4 className="text-sm font-bold text-white leading-snug">{name}</h4>
          <p className="text-[10px] text-purple-300/60 mt-0.5 truncate">
            {shortAddress}
          </p>
        </div>

        {description && (
          <p className="text-[11px] text-purple-200/70 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Coordinates */}
        <div className="flex items-center gap-1.5 text-[9px] text-purple-400/50 font-mono">
          <Globe2 className="w-3 h-3" />
          <span>
            {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Vote Button */}
          <button
            type="button"
            onClick={handleVote}
            disabled={isVoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
              hasVoted
                ? 'bg-purple-700/80 border-purple-400/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/60 border-purple-800/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-600/50'
            }`}
          >
            {isVoting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
            )}
            <span>{voteCount > 0 ? voteCount : 'Vote'}</span>
          </button>

          {/* View on Globe Button */}
          <button
            type="button"
            onClick={handleViewOnGlobe}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-purple-950/60 border border-purple-800/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-600/50 transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Globe</span>
          </button>

          {/* Admin: Select Final Location */}
          {isAdmin && !isSelected && (
            <button
              type="button"
              onClick={handleSelect}
              disabled={isSelecting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500/50 transition-all cursor-pointer ml-auto"
            >
              {isSelecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crown className="w-3.5 h-3.5" />
              )}
              <span>Select</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
