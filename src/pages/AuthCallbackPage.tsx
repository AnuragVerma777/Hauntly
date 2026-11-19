import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { GothicCard } from '../components/ui/GothicCard';
import { GothicButton } from '../components/ui/GothicButton';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 1. Check for error parameters in query string or hash
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1));

      const errorDescription =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');

      if (errorDescription) {
        setErrorMessage(decodeURIComponent(errorDescription));
        return;
      }

      // 2. Allow Supabase auth client to finalize the session exchange
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data?.session) {
          // Successfully authenticated!
          navigate('/profile', { replace: true });
        } else {
          // If session wasn't immediately synchronous, wait briefly or listen to onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              authListener.subscription.unsubscribe();
              navigate('/profile', { replace: true });
            }
          });

          // Timeout fallback in case auth parameters were incomplete
          const timer = setTimeout(() => {
            authListener.subscription.unsubscribe();
            // Check once more
            supabase.auth.getSession().then(({ data: fallbackData }) => {
              if (fallbackData?.session) {
                navigate('/profile', { replace: true });
              } else {
                setErrorMessage(
                  'No active session could be deciphered from the ether. Please attempt authentication once more.'
                );
              }
            });
          }, 3500);

          return () => clearTimeout(timer);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Unknown spiritual anomaly during auth callback');
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16">
      <GothicCard glow className="w-full max-w-md text-center space-y-6">
        {errorMessage ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/60 mx-auto flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-white">OAuth Communion Interrupted</h2>
            <div className="p-3.5 rounded-xl bg-[#140816] border border-rose-900/50 text-xs text-rose-300 leading-relaxed text-left">
              {errorMessage}
            </div>
            <p className="text-xs text-purple-400/60">
              Verify your Supabase Redirect URL and Provider credentials in the Supabase Dashboard.
            </p>
            <Link to="/login" className="block pt-2">
              <GothicButton variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Return to Login
              </GothicButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-purple-500/60 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <img src="/hauntly-icon.png" alt="Hauntly Mascot" className="w-full h-full object-cover animate-ghostly-float" />
              </div>
              <div className="absolute -inset-2 rounded-2xl border border-purple-500/30 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="text-xl font-serif font-bold text-white">Exchanging Spectral Tokens</h2>
            <p className="text-xs text-purple-300/70 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              Harmonizing your Supabase OAuth session...
            </p>
          </div>
        )}
      </GothicCard>
    </div>
  );
};
