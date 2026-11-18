import React from 'react';

export const MysticalBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-[#07040c] text-purple-100 overflow-hidden flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Background ambient radial glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-[500px] h-[500px] bg-violet-950/25 rounded-full blur-[150px] animate-spectral-glow" />
        <div className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] bg-indigo-950/20 rounded-full blur-[160px]" />
        
        {/* Subtle gothic arcane grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d8b4fe 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Vignette border */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#050308]/90" />
      </div>

      {/* Main app content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
