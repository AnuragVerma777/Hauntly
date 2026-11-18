import React from 'react';

interface GothicBadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'emerald' | 'amber' | 'rose' | 'obsidian';
  icon?: React.ReactNode;
  className?: string;
}

export const GothicBadge: React.FC<GothicBadgeProps> = ({
  children,
  variant = 'purple',
  icon,
  className = '',
}) => {
  const variantStyles = {
    purple: 'bg-purple-950/70 text-purple-300 border-purple-800/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-850/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-800/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-850/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    obsidian: 'bg-[#10091c] text-purple-200/80 border-purple-900/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
