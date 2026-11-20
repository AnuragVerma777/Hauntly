import React, { useState } from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Loader2,
  Compass,
  AlertCircle,
} from 'lucide-react';
import type { GroupLocationInsert, LocationCategory } from '../../types/globe';
import type { Group } from '../../types/groupChat';

interface AddLocationModalProps {
  group: Group;
  currentUserId: string;
  defaultCoords?: { latitude: number; longitude: number };
  onClose: () => void;
  onLocationAdded: (loc: any) => void;
  onSubmit: (insert: GroupLocationInsert) => Promise<{ data: any; error: Error | null }>;
}

const CATEGORIES: { id: LocationCategory; label: string }[] = [
  { id: 'sanctuary', label: 'Sanctuary' },
  { id: 'crypt', label: 'Crypt & Tomb' },
  { id: 'coven_hall', label: 'Coven Hall' },
  { id: 'historic', label: 'Historic Relic' },
  { id: 'observatory', label: 'Nocturnal Observatory' },
  { id: 'gathering', label: 'Gathering Point' },
];

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  group,
  currentUserId,
  defaultCoords,
  onClose,
  onLocationAdded,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(defaultCoords ? defaultCoords.latitude.toFixed(4) : '45.0000');
  const [longitude, setLongitude] = useState(defaultCoords ? defaultCoords.longitude.toFixed(4) : '15.0000');
  const [category, setCategory] = useState<LocationCategory>('sanctuary');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (!name.trim()) {
      setError('Please provide a name for this sanctuary.');
      return;
    }
    if (!address.trim()) {
      setError('Please provide an address or physical region.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setLoading(true);
    const res = await onSubmit({
      group_id: group.id,
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
      latitude: latNum,
      longitude: lngNum,
      category,
      suggested_by: currentUserId,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      onLocationAdded(res.data);
      onClose();
    }
  };

  const handleApplyPreset = (lat: number, lng: number, place: string, addr: string) => {
    setLatitude(lat.toFixed(4));
    setLongitude(lng.toFixed(4));
    setName(place);
    setAddress(addr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-3xl border border-purple-500/40 p-6 text-white shadow-[0_0_50px_rgba(168,85,247,0.35)] relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #200742 0%, #0d021f 60%, #05010e 100%)',
        }}
      >
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-600/50 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-white tracking-wide">
                Summon Coven Location
              </h3>
              <p className="text-[11px] text-purple-300/70">
                Pin an ethereal sanctuary to {group.name} on the 3D Earth Globe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/60 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-300/70 tracking-wider">
              Quick Gothic Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    45.5152,
                    25.3672,
                    "Bran Castle (Transylvania)",
                    "Strada General Traian Moșoiu 24, Bran, Romania"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-800/50 text-[10px] text-purple-300 transition-colors cursor-pointer"
              >
                🏰 Transylvania
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    42.5211,
                    -70.8985,
                    "Salem Witch Relic",
                    "310 Essex St, Salem, MA, USA"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-800/50 text-[10px] text-purple-300 transition-colors cursor-pointer"
              >
                🕯️ Salem
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    48.8338,
                    2.3324,
                    "Paris Catacombs",
                    "1 Avenue du Colonel Henri Rol-Tanguy, Paris, France"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-800/50 text-[10px] text-purple-300 transition-colors cursor-pointer"
              >
                💀 Paris Catacombs
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    35.4745,
                    138.6496,
                    "Aokigahara Sea of Trees",
                    "Yamanashi, Japan"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/70 border border-purple-800/50 text-[10px] text-purple-300 transition-colors cursor-pointer"
              >
                🌲 Aokigahara
              </button>
            </div>
          </div>

          {/* Place Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-purple-200 block">Sanctuary Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Castle of Shadows"
              className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-400/40 outline-none transition-all"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-purple-200 block">Physical Address / Region</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, country..."
                className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-purple-400/40 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-purple-200 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LocationCategory)}
              className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#120524]">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinates (Lat / Lng) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-purple-200 flex items-center gap-1">
                <Compass className="w-3 h-3 text-purple-400" />
                <span>Latitude (-90 to 90)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-purple-200 flex items-center gap-1">
                <Compass className="w-3 h-3 text-purple-400" />
                <span>Longitude (-180 to 180)</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-purple-200 block">Sanctuary Lore / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does your coven gather here? Ethereal lore, secrets, meeting times..."
              className="w-full bg-[#14062a] border border-purple-800/50 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-400/40 outline-none transition-all resize-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Summoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pin Location</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
