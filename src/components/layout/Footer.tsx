import React from 'react';
import { Ghost, Moon, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-purple-950/70 bg-[#060309]/90 text-purple-300/60 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <img src="/hauntly-icon.png" alt="Hauntly Icon" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif font-bold tracking-wider text-purple-200">HAUNTLY</span>
          <span className="text-xs text-purple-500/50">| Where lost souls gather & whispers linger</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-purple-400/70">
          <span className="flex items-center gap-1.5 hover:text-purple-300 transition-colors">
            <Ghost className="w-3.5 h-3.5" /> End-to-End Spectral Encryption
          </span>
          <span className="flex items-center gap-1.5 hover:text-purple-300 transition-colors">
            <Moon className="w-3.5 h-3.5" /> Zero Daylight Policy
          </span>
          <span className="flex items-center gap-1.5 hover:text-purple-300 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Supabase Vault Secured
          </span>
        </div>

        <div className="text-xs text-purple-500/60 flex items-center gap-1">
          Summoned with <Heart className="w-3 h-3 text-purple-400 fill-purple-400/40" /> for midnight wanderers.
        </div>
      </div>
    </footer>
  );
};
