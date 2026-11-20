import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Search,
  Sparkles,
  AlertTriangle,
  Globe,
  Filter,
} from 'lucide-react';
import type { GroupLocation, LocationCategory } from '../../types/globe';
import type { Group } from '../../types/groupChat';

interface LocationListViewProps {
  locations: GroupLocation[];
  group: Group;
  selectedLocation: GroupLocation | null;
  onSelectLocation: (loc: GroupLocation) => void;
  onOpenAddModal: () => void;
  isFallback?: boolean;
  onSwitchToGlobe?: () => void;
}

const CATEGORY_TABS: { id: LocationCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Sanctuaries' },
  { id: 'sanctuary', label: 'Sanctuaries' },
  { id: 'crypt', label: 'Crypts & Tombs' },
  { id: 'historic', label: 'Historic Relics' },
  { id: 'coven_hall', label: 'Coven Halls' },
  { id: 'observatory', label: 'Observatories' },
];

export const LocationListView: React.FC<LocationListViewProps> = ({
  locations,
  group,
  selectedLocation,
  onSelectLocation,
  onOpenAddModal,
  isFallback = false,
  onSwitchToGlobe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<LocationCategory | 'all'>('all');

  const filtered = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || loc.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0316] p-4 sm:p-6 lg:p-8">
      {/* Fallback Banner if WebGL failed */}
      {isFallback && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              WebGL hardware acceleration was unavailable or encountered an issue. Ethereal list fallback is active.
            </span>
          </div>
          {onSwitchToGlobe && (
            <button
              type="button"
              onClick={onSwitchToGlobe}
              className="px-3 py-1 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0 ml-3 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Retry 3D Globe</span>
            </button>
          )}
        </div>
      )}

      {/* Top Controls: Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${locations.length} sanctuaries in ${group.name}...`}
            className="w-full bg-[#130626] border border-purple-800/40 focus:border-purple-500/60 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 outline-none transition-all font-medium"
          />
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summon Location</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-purple-400/60 shrink-0 mr-1" />
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCat(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCat === tab.id
                ? 'bg-purple-700/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-purple-950/40 text-purple-300/70 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Locations Grid */}
      <div className="flex-1 overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-purple-900/40">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-purple-300/70">
            <MapPin className="w-10 h-10 text-purple-500/40 mb-3" />
            <h4 className="text-base font-serif font-bold text-white mb-1">
              No Sanctuaries Found
            </h4>
            <p className="text-xs text-purple-400/60 max-w-sm mb-4">
              {searchQuery
                ? 'No locations match your search query.'
                : 'No sanctuaries have been pinned to this coven circle yet.'}
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-purple-800/60 hover:bg-purple-700/70 text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              Add First Location
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const suggestedName = loc.suggested_by_profile?.display_name || 'Spirit';
              const suggestedAvatar =
                loc.suggested_by_profile?.avatar_url || '/chat/avatar_designers_hero.png';

              return (
                <div
                  key={loc.id}
                  onClick={() => onSelectLocation(loc)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-900/80 to-[#1b0638] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                      : 'bg-[#120524]/70 hover:bg-[#180730]/80 border-purple-900/40 hover:border-purple-700/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-950/80 border border-purple-700/40 text-purple-300">
                          {loc.category.replace('_', ' ')}
                        </span>
                        {loc.is_selected && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                            ⭐ Chosen
                          </span>
                        )}
                        {!loc.is_selected && loc.leading_location && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-950/80 border border-amber-500/60 text-amber-300">
                            👑 Leading
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {typeof loc.vote_count === 'number' && loc.vote_count > 0 && (
                          <span className="text-[9px] text-purple-200 font-mono font-bold bg-purple-900/60 px-1.5 py-0.5 rounded-md border border-purple-600/40">
                            {loc.vote_count} {loc.vote_count === 1 ? 'vote' : 'votes'}
                          </span>
                        )}
                        <span className="text-[10px] text-purple-400/60 font-mono">
                          {new Date(loc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug mb-1 group-hover:text-purple-200">
                      {loc.name}
                    </h4>

                    <div className="flex items-start gap-1.5 text-[11px] text-purple-300/70 mb-2.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{loc.address}</span>
                    </div>

                    {loc.description && (
                      <p className="text-[11px] text-purple-300/60 line-clamp-2 leading-relaxed mb-3">
                        {loc.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={suggestedAvatar}
                        alt={suggestedName}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-500/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
                        }}
                      />
                      <span className="text-purple-300 font-medium text-[10px]">
                        {suggestedName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px] text-purple-400/80 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-900/40">
                      <Compass className="w-3 h-3" />
                      <span>
                        {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
