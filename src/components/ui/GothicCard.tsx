import React from 'react';

interface GothicCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  id?: string;
}

export const GothicCard: React.FC<GothicCardProps> = ({
  children,
  className = '',
  glow = false,
  id,
}) => {
  return (
    <div
      id={id}
      className={`relative rounded-2xl bg-[#0c0716]/85 backdrop-blur-xl border border-purple-900/40 p-6 md:p-8 transition-all duration-300
        ${
          glow
            ? 'shadow-[0_0_35px_rgba(147,51,234,0.18)] hover:shadow-[0_0_45px_rgba(168,85,247,0.25)] border-purple-700/50'
            : 'shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:border-purple-800/60'
        }
        ${className}
      `}
    >
      {/* Corner arcane flourish accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-400/30 rounded-tl" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-400/30 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-400/30 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-400/30 rounded-br" />

      {children}
    </div>
  );
};
