import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Search,
  MapPin,
  Loader2,
  Globe2,
  Navigation,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { GeocodingResult } from '../../lib/locationSuggestionService';
import { searchPlaces } from '../../lib/locationSuggestionService';

interface SuggestLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggest: (place: {
    name: string;
    address: string;
    description: string;
    latitude: number;
    longitude: number;
    category: string;
  }) => void;
  submitting?: boolean;
}

const CATEGORY_OPTIONS = [
  { id: 'sanctuary', label: '🏰 Sanctuary', color: 'from-purple-600 to-purple-900' },
  { id: 'crypt', label: '⚰️ Crypt & Tomb', color: 'from-slate-600 to-slate-900' },
  { id: 'historic', label: '🏛️ Historic Relic', color: 'from-amber-700 to-amber-950' },
  { id: 'coven_hall', label: '🕯️ Coven Hall', color: 'from-rose-700 to-rose-950' },
  { id: 'observatory', label: '🌙 Observatory', color: 'from-indigo-600 to-indigo-950' },
  { id: 'gathering', label: '👻 Gathering', color: 'from-emerald-700 to-emerald-950' },
];

export const SuggestLocationModal: React.FC<SuggestLocationModalProps> = ({
  isOpen,
  onClose,
  onSuggest,
  submitting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GeocodingResult | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sanctuary');
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setError(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(value);
        setResults(places);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectPlace = (place: GeocodingResult) => {
    setSelected(place);
    setSearchQuery(place.name);
    setResults([]);
  };

  const handleSubmit = () => {
    if (!selected) {
      setError('Please search for and select a place first.');
      return;
    }

    onSuggest({
      name: selected.name,
      address: selected.display_name,
      description: description.trim() || `A suggested gathering point for the coven.`,
      latitude: selected.lat,
      longitude: selected.lon,
      category,
    });
  };

  const handleReset = () => {
    setSelected(null);
    setSearchQuery('');
    setResults([]);
    setDescription('');
    setCategory('sanctuary');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-3xl border border-purple-700/50 overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.3)]"
        style={{
          background: 'linear-gradient(180deg, #1a0a33 0%, #0d0420 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-600/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <MapPin className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Suggest Location
              </h2>
              <p className="text-[10px] text-purple-300/60">
                Search for a place to suggest to the coven
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-900/60 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for a place... (e.g., Transylvania, Salem)"
              className="w-full bg-[#170a2f]/80 text-xs text-white placeholder-purple-400/40 rounded-xl pl-10 pr-10 py-3 outline-none border border-purple-900/40 focus:border-purple-500/60 transition-all font-medium"
              autoFocus
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
            )}
            {selected && !searching && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {results.length > 0 && !selected && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-purple-800/40 bg-[#0d0420] divide-y divide-purple-900/30 scrollbar-thin scrollbar-thumb-purple-900/40">
              {results.map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-4 py-3 hover:bg-purple-900/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 group-hover:text-purple-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {place.name}
                      </p>
                      <p className="text-[10px] text-purple-300/60 truncate mt-0.5">
                        {place.display_name}
                      </p>
                      <p className="text-[9px] text-purple-400/40 font-mono mt-0.5">
                        {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Place Preview */}
          {selected && (
            <div className="rounded-xl border border-purple-600/40 bg-[#1a0a33]/60 p-4 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white">{selected.name}</h3>
                  <p className="text-[10px] text-purple-300/60 mt-0.5 truncate">
                    {selected.display_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-purple-400 font-mono">
                      <Globe2 className="w-3 h-3" />
                      {selected.lat.toFixed(4)}° N, {selected.lon.toFixed(4)}° E
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why should the coven visit this place? (optional)"
                rows={2}
                className="w-full bg-[#0d0420]/80 text-xs text-white placeholder-purple-400/40 rounded-xl px-3 py-2.5 outline-none border border-purple-900/40 focus:border-purple-500/60 transition-all resize-none"
              />

              {/* Category */}
              <div>
                <p className="text-[10px] font-semibold text-purple-300/70 mb-2 tracking-wide uppercase">
                  Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                        category === cat.id
                          ? `bg-gradient-to-r ${cat.color} border-purple-400/60 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]`
                          : 'bg-purple-950/40 border-purple-800/40 text-purple-300/70 hover:border-purple-600/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]"
            style={{
              background: selected
                ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)'
                : 'rgba(88, 28, 135, 0.4)',
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Summoning Location...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Suggest to Coven</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
