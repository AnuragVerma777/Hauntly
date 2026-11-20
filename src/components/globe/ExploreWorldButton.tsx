import React, { useState } from 'react';
import { Globe, ChevronRight, X, Sparkles, Navigation, Plus } from 'lucide-react';
import type { GroupLocation } from '../../types/globe';

interface ExploreWorldButtonProps {
  locations: GroupLocation[];
  onFlyToLocation: (loc: GroupLocation) => void;
  onOpenAddModal: () => void;
}

export const ExploreWorldButton: React.FC<ExploreWorldButtonProps> = ({
  locations,
  onFlyToLocation,
  onOpenAddModal,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 select-none">
      {/* ── Glassmorphic Explore Button ── */}
      <button
        type="button"
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full border border-purple-500/40 hover:border-purple-400 bg-[#16092c]/80 hover:bg-[#200c3f]/90 text-white backdrop-blur-xl transition-all cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)]"
        title="Explore world sanctuaries and haunted realms"
      >
        <Globe className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors animate-spin [animation-duration:30s]" />
        <span className="text-xs font-semibold tracking-wide text-purple-100">
          Explore the world...
        </span>
        <ChevronRight className={`w-3.5 h-3.5 text-purple-400 group-hover:text-white transition-transform ${drawerOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* ── Slide-up Explore World Tray ── */}
      {drawerOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-84 sm:w-96 rounded-3xl border border-purple-600/50 bg-[#120524]/95 backdrop-blur-2xl p-4 shadow-[0_10px_45px_rgba(0,0,0,0.8),0_0_30px_rgba(147,51,234,0.35)] animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Explore World Sanctuaries
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-6 h-6 rounded-full bg-purple-950/70 hover:bg-purple-800/80 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenAddModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Summon New Sanctuary</span>
            </button>
          </div>

          {/* Sanctuaries List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-900/40">
            {locations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => {
                  onFlyToLocation(loc);
                  setDrawerOpen(false);
                }}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-900/30 hover:border-purple-600/50 transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-white truncate block group-hover:text-purple-200">
                      {loc.name}
                    </span>
                    {loc.is_selected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-extrabold">
                        ⭐ CHOSEN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-purple-300/70 block truncate">
                    {loc.address}
                  </span>
                </div>

                <div className="p-1.5 rounded-xl bg-purple-800/60 group-hover:bg-purple-700 text-purple-200 group-hover:text-white transition-all shrink-0 shadow-sm">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
