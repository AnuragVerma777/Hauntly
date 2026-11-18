import React from 'react';
import { Loader2 } from 'lucide-react';

interface GothicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GothicButton: React.FC<GothicButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none overflow-hidden cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:from-purple-600 hover:to-violet-500 border border-purple-400/30 active:scale-[0.99]',
    secondary:
      'bg-[#120a1f] text-purple-200 border border-purple-800/60 hover:bg-[#1a0f2c] hover:border-purple-600/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] active:scale-[0.99]',
    ghost:
      'bg-transparent text-purple-300 hover:text-white hover:bg-purple-950/40 border border-transparent hover:border-purple-800/40',
    outline:
      'bg-transparent text-purple-200 border border-purple-500/40 hover:bg-purple-950/30 hover:border-purple-400 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    danger:
      'bg-gradient-to-r from-red-950/90 to-rose-900/90 text-rose-200 border border-rose-800/60 hover:border-rose-600 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
          <span>Summoning...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
