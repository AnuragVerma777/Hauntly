import React, { useMemo } from 'react';

/**
 * 🌌 GlobeAuraOverlay
 * Pure cosmic night void with dense, natural twinkling pinpoint stars.
 * Zero artificial rings or circles — true deep space night sky.
 */
export const GlobeAuraOverlay: React.FC = () => {
  // Dense, natural cosmic starfield across all quadrants
  const stars = useMemo(() => {
    const list = [
      // Top Left Quadrant
      { t: 4, l: 8, s: 1.2, o: 0.8, a: '3.1s' },
      { t: 7, l: 22, s: 1.8, o: 0.9, a: '4.2s' },
      { t: 12, l: 5, s: 1.0, o: 0.6, a: '2.5s' },
      { t: 16, l: 15, s: 1.5, o: 0.85, a: '3.8s' },
      { t: 21, l: 28, s: 2.0, o: 0.95, a: '4.8s' },
      { t: 26, l: 9, s: 1.1, o: 0.7, a: '3.3s' },
      { t: 32, l: 2, s: 1.6, o: 0.8, a: '2.9s' },
      { t: 37, l: 19, s: 1.3, o: 0.75, a: '4.1s' },
      { t: 43, l: 7, s: 2.2, o: 0.9, a: '5.2s' },
      { t: 48, l: 24, s: 1.0, o: 0.65, a: '3.6s' },

      // Bottom Left Quadrant
      { t: 54, l: 12, s: 1.4, o: 0.8, a: '3.4s' },
      { t: 59, l: 4, s: 1.7, o: 0.85, a: '4.5s' },
      { t: 65, l: 20, s: 1.1, o: 0.7, a: '2.8s' },
      { t: 71, l: 8, s: 2.0, o: 0.95, a: '4.9s' },
      { t: 76, l: 16, s: 1.3, o: 0.75, a: '3.7s' },
      { t: 82, l: 25, s: 1.5, o: 0.85, a: '3.2s' },
      { t: 87, l: 6, s: 1.8, o: 0.9, a: '4.3s' },
      { t: 92, l: 14, s: 1.0, o: 0.6, a: '2.7s' },
      { t: 96, l: 29, s: 1.6, o: 0.8, a: '5.0s' },

      // Top Center & Upper Sky
      { t: 3, l: 38, s: 1.3, o: 0.75, a: '3.5s' },
      { t: 6, l: 52, s: 2.1, o: 0.95, a: '4.4s' },
      { t: 10, l: 44, s: 1.0, o: 0.6, a: '2.6s' },
      { t: 14, l: 62, s: 1.6, o: 0.85, a: '3.9s' },
      { t: 19, l: 48, s: 1.2, o: 0.7, a: '4.7s' },

      // Top Right Quadrant
      { t: 5, l: 74, s: 1.5, o: 0.8, a: '3.3s' },
      { t: 8, l: 88, s: 2.0, o: 0.95, a: '4.6s' },
      { t: 13, l: 81, s: 1.1, o: 0.65, a: '2.8s' },
      { t: 18, l: 94, s: 1.7, o: 0.9, a: '3.9s' },
      { t: 24, l: 76, s: 1.4, o: 0.75, a: '4.3s' },
      { t: 29, l: 89, s: 2.2, o: 0.95, a: '5.1s' },
      { t: 34, l: 96, s: 1.0, o: 0.6, a: '3.0s' },
      { t: 40, l: 82, s: 1.6, o: 0.85, a: '4.0s' },
      { t: 46, l: 92, s: 1.3, o: 0.7, a: '3.6s' },

      // Bottom Right Quadrant
      { t: 52, l: 86, s: 1.8, o: 0.9, a: '4.4s' },
      { t: 57, l: 95, s: 1.1, o: 0.65, a: '2.7s' },
      { t: 63, l: 79, s: 2.0, o: 0.95, a: '4.8s' },
      { t: 69, l: 91, s: 1.4, o: 0.8, a: '3.5s' },
      { t: 74, l: 84, s: 1.2, o: 0.7, a: '4.2s' },
      { t: 80, l: 97, s: 1.9, o: 0.9, a: '5.3s' },
      { t: 85, l: 76, s: 1.0, o: 0.6, a: '2.9s' },
      { t: 90, l: 88, s: 1.6, o: 0.85, a: '3.8s' },
      { t: 95, l: 81, s: 2.1, o: 0.95, a: '4.7s' },

      // Bottom Center & Lower Sky
      { t: 88, l: 42, s: 1.3, o: 0.7, a: '3.2s' },
      { t: 93, l: 56, s: 1.7, o: 0.85, a: '4.1s' },
      { t: 97, l: 48, s: 1.1, o: 0.6, a: '2.8s' },
    ];
    return list;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      {/* ── Complete Pure Night Deep Space Void ── */}
      <div
        className="absolute inset-0"
        style={{
          background: '#04010a',
        }}
      />

      {/* ── Realistic Pinpoint Starfield ── */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${star.t}%`,
              left: `${star.l}%`,
              width: `${star.s}px`,
              height: `${star.s}px`,
              opacity: star.o,
              animationDuration: star.a,
              boxShadow: star.s > 1.7 ? '0 0 3px rgba(255, 255, 255, 0.95)' : 'none',
            }}
          />
        ))}

        {/* Delicate 4-Pointed Sparkle Accents */}
        <div className="absolute top-[11%] left-[17%] text-white text-xs opacity-80 animate-pulse [animation-duration:3.4s] drop-shadow-[0_0_4px_#ffffff]">
          ✦
        </div>
        <div className="absolute top-[21%] right-[11%] text-slate-200 text-sm opacity-85 animate-pulse [animation-duration:4.6s] drop-shadow-[0_0_5px_#ffffff]">
          ✦
        </div>
        <div className="absolute bottom-[17%] left-[11%] text-slate-300 text-xs opacity-75 animate-pulse [animation-duration:3.9s]">
          ✦
        </div>
        <div className="absolute bottom-[23%] right-[15%] text-white text-xs opacity-80 animate-pulse [animation-duration:5.1s]">
          ✦
        </div>
        <div className="absolute top-[38%] left-[4%] text-slate-200 text-[10px] opacity-70 animate-pulse [animation-duration:4.0s]">
          ✦
        </div>
        <div className="absolute top-[44%] right-[5%] text-slate-200 text-[10px] opacity-70 animate-pulse [animation-duration:4.2s]">
          ✦
        </div>
      </div>
    </div>
  );
};
