import React, { forwardRef } from 'react';

interface GothicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GothicInput = forwardRef<HTMLInputElement, GothicInputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium tracking-wide uppercase text-purple-300/80">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60 group-focus-within:text-purple-300 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#0d0716]/90 text-purple-100 placeholder-purple-400/30 text-sm rounded-xl border transition-all duration-300 outline-none
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2.5
              ${
                error
                  ? 'border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-purple-900/50 hover:border-purple-700/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:bg-[#130a21]/95 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              }
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-400/60">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 font-medium pl-1 flex items-center gap-1">⚠️ {error}</p>}
        {hint && !error && <p className="text-xs text-purple-400/50 pl-1">{hint}</p>}
      </div>
    );
  }
);

GothicInput.displayName = 'GothicInput';
