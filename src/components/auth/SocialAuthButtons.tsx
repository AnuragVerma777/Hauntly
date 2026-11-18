import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { OAuthProvider } from '../../types/auth';

interface SocialAuthButtonsProps {
  onAuthError?: (message: string) => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onAuthError }) => {
  const { signInWithOAuth, isConfigured } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    try {
      setLoadingProvider(provider);
      const { error } = await signInWithOAuth(provider);
      if (error) {
        onAuthError?.(error.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during OAuth invocation';
      onAuthError?.(message);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loadingProvider !== null}
        className="w-full relative group flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-purple-100 bg-[#120821]/80 hover:bg-[#1a0c2e] border border-purple-900/60 hover:border-purple-600/80 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12c0 2 .6 3.8 1.6 5.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.8-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
            />
          </svg>
        )}
        <span>{loadingProvider === 'google' ? 'Summoning Google...' : 'Continue with Google'}</span>
      </button>

      {/* Apple OAuth Button */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('apple')}
        disabled={loadingProvider !== null}
        className="w-full relative group flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-purple-100 bg-[#120821]/80 hover:bg-[#1a0c2e] border border-purple-900/60 hover:border-purple-600/80 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loadingProvider === 'apple' ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
        ) : (
          <svg className="w-4 h-4 shrink-0 fill-current text-purple-200" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-5.99-9.33-10.74-20.09-14.25-32.28-3.51-12.2-5.27-23.75-5.27-34.65 0-14.28 3.51-26.05 10.53-35.31 7.02-9.26 15.82-13.98 26.4-14.16 4.35 0 9.23 1.15 14.64 3.45 5.4 2.3 9.4 3.51 11.99 3.63 2.18-.24 6.37-1.5 12.57-3.79 6.2-2.3 11.45-3.37 15.77-3.23 12.08.62 21.6 4.7 28.56 12.25-10.53 6.38-15.66 15.35-15.39 26.92.27 9.17 3.86 16.92 10.77 23.25 4.35 4.01 9.49 6.75 15.42 8.22-2.3 7.06-5.31 14.65-9.04 22.77zM119.22 31.84c0-7.36 2.62-14.15 7.86-20.37 5.24-6.22 11.65-10.05 19.24-11.47.78 6.4-1.12 12.75-5.7 19.06-4.58 6.3-10.74 10.15-18.48 11.55-.44-.88-.7-1.74-.92-2.58-.22-.84-.33-1.68-.33-2.52l.33-6.25z" />
          </svg>
        )}
        <span>{loadingProvider === 'apple' ? 'Summoning Apple...' : 'Continue with Apple'}</span>
      </button>

      {!isConfigured && (
        <div className="pt-1">
          <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-center">
            ⚙️ Configure Google & Apple OAuth in Supabase Dashboard to complete live authorization.
          </p>
        </div>
      )}
    </div>
  );
};
