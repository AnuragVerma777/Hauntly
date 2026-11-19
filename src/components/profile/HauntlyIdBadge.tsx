import React, { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

interface HauntlyIdBadgeProps {
  hauntlyId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const HauntlyIdBadge: React.FC<HauntlyIdBadgeProps> = ({
  hauntlyId,
  size = 'md',
  showLabel = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hauntlyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {showLabel && (
        <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400/60">
          ID:
        </span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        title="Click to copy permanent Hauntly ID"
        className={`inline-flex items-center rounded-lg font-mono font-bold tracking-wider transition-all duration-200 border cursor-pointer select-all ${sizeClasses[size]} ${
          copied
            ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            : 'bg-purple-950/50 border-purple-600/40 text-purple-200 hover:bg-purple-900/60 hover:border-purple-400 hover:text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]'
        }`}
      >
        <Sparkles className={`text-purple-400 ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        <span>{hauntlyId}</span>
        {copied ? (
          <Check className={`text-emerald-400 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        ) : (
          <Copy className={`text-purple-400/70 hover:text-purple-200 ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        )}
      </button>
    </div>
  );
};
