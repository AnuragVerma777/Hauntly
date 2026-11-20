import React from 'react';

interface GothicCompassProps {
  bearing: number;
  onResetNorth: () => void;
}

export const GothicCompass: React.FC<GothicCompassProps> = ({
  bearing,
  onResetNorth,
}) => {
  return (
    <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-30 select-none">
      <button
        type="button"
        onClick={onResetNorth}
        className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 cursor-pointer border-0 bg-transparent outline-none transition-transform hover:scale-105 active:scale-95"
        title={`Compass Bearing: ${Math.round(bearing)}° (Click to orient North)`}
      >
        {/* Ambient Purple Glow */}
        <div className="absolute inset-0 rounded-full bg-purple-600/15 filter blur-md group-hover:bg-purple-500/30 transition-all" />

        {/* Outer Circular Ring */}
        <div className="absolute inset-1 rounded-full border border-purple-500/30 group-hover:border-purple-400/60 transition-colors bg-[#110526]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.25)]" />

        {/* Rotating Compass Dial */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${-bearing}deg)` }}
        >
          {/* Cardinal Points */}
          <span className="absolute top-1 text-[11px] sm:text-xs font-serif font-black tracking-widest text-purple-200 group-hover:text-white drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
            N
          </span>
          <span className="absolute right-1.5 text-[10px] sm:text-[11px] font-serif font-bold text-purple-400/70 group-hover:text-purple-200">
            E
          </span>
          <span className="absolute bottom-1 text-[10px] sm:text-[11px] font-serif font-bold text-purple-400/70 group-hover:text-purple-200">
            S
          </span>
          <span className="absolute left-1.5 text-[10px] sm:text-[11px] font-serif font-bold text-purple-400/70 group-hover:text-purple-200">
            W
          </span>

          {/* Crosshair Lines */}
          <div className="absolute w-[70%] h-px bg-purple-500/25" />
          <div className="absolute h-[70%] w-px bg-purple-500/25" />

          {/* Central 4-Pointed Celestial Star */}
          <div className="relative z-10 w-6 h-6 flex items-center justify-center">
            {/* North Indicator Needle */}
            <div
              className="absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[10px] border-b-purple-300 filter drop-shadow-[0_0_6px_#c084fc]"
            />
            {/* South Needle */}
            <div
              className="absolute -bottom-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[10px] border-t-purple-700/60"
            />
            {/* Center Core Star */}
            <svg
              className="w-5 h-5 text-purple-300 drop-shadow-[0_0_10px_#e879f9]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
};
