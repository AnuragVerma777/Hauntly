import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Moon,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { OAuthProvider } from '../../types/auth';

interface SpookyAuthScreenProps {
  initialMode?: 'signin' | 'signup';
}

export const SpookyAuthScreen: React.FC<SpookyAuthScreenProps> = ({
  initialMode = 'signin',
}) => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Password Strength for signup
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { text: 'Faint Spirit', color: 'bg-rose-500', width: '25%' };
      case 2:
        return { text: 'Restless Ghost', color: 'bg-amber-500', width: '50%' };
      case 3:
        return { text: 'Vengeful Wraith', color: 'bg-purple-500', width: '75%' };
      case 4:
        return { text: 'Ancient Sovereign', color: 'bg-emerald-400', width: '100%' };
      default:
        return { text: 'Unsummoned', color: 'bg-purple-900', width: '5%' };
    }
  };

  const strength = calculateStrength(password);

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setErrorMessage(null);
    try {
      setLoadingProvider(provider);
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Spiritual disturbance during OAuth connection.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Please provide both spectral email and secret cipher.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('Cipher must be at least 6 characters in length.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Cipher confirmations do not match across the ether.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await signUpWithEmail(email, password, displayName);
        if (error) {
          setErrorMessage(error.message);
        } else if (data?.user && !data.session) {
          setSuccessNotice(
            'A spiritual verification link has been dispatched to your email! Please check your inbox to cross the threshold.'
          );
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ritual binding failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 overflow-hidden bg-[#07040c]"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(16, 6, 28, 0.45) 0%, rgba(7, 4, 12, 0.85) 100%), url('/clean_spooky_bg_2x.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top Left Navigation Link */}
      <div className="absolute top-5 left-5 sm:top-7 sm:left-8 z-30">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b0c33]/70 hover:bg-[#2a134d]/90 border border-purple-500/30 text-xs font-medium text-purple-200/80 hover:text-white transition-all backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sanctuary</span>
        </Link>
      </div>

      {/* Top Right Moon Button (Exactly matching the reference image) */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30">
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[#1b0c33]/70 hover:bg-[#2a134d]/90 border border-purple-500/35 flex items-center justify-center text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.35)] transition-all cursor-pointer backdrop-blur-md"
          title="Nocturnal Mode Active"
        >
          <Moon className="w-4 h-4 fill-purple-300/40 text-purple-200" />
        </button>
      </div>

      {/* Center Branding & Action Container */}
      <div className="relative z-20 w-full max-w-[380px] flex flex-col items-center text-center animate-fadeIn">
        {/* Cute Ghost Avatar with Cosmic Orbit Ring */}
        <div className="relative mb-2 flex items-center justify-center">
          <img
            src="/ghost_character.png"
            alt="Hauntly Ghost"
            className="w-24 sm:w-28 h-auto select-none pointer-events-none drop-shadow-[0_0_25px_rgba(192,132,252,0.65)] animate-ghostly-float"
          />
        </div>

        {/* Hauntly Logo */}
        <div className="flex items-center justify-center mb-1">
          <img
            src="/hauntly_logo.png"
            alt="Hauntly"
            className="w-38 sm:w-44 h-auto select-none pointer-events-none drop-shadow-[0_0_22px_rgba(168,85,247,0.5)]"
          />
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm text-purple-200/85 tracking-wide font-sans mb-7 font-normal">
          Chat <span className="mx-2 text-purple-400/60 font-serif">·</span> Explore{' '}
          <span className="mx-2 text-purple-400/60 font-serif">·</span> Get Spooked
        </p>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="w-full max-w-[340px] mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2 backdrop-blur-md animate-fadeIn text-left shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="w-full max-w-[340px] mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-start gap-2 backdrop-blur-md animate-fadeIn text-left shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{successNotice}</span>
          </div>
        )}

        {/* Main View: Exact Pill Buttons matching user's design */}
        {!showEmailForm ? (
          <div className="w-full flex flex-col items-center space-y-3">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loadingProvider !== null}
              className="w-full max-w-[340px] flex items-center justify-between px-5 py-3 rounded-full bg-[#1d0e37]/75 hover:bg-[#28134a]/90 active:scale-[0.99] border border-purple-500/35 hover:border-purple-400/70 shadow-[0_4px_20px_rgba(0,0,0,0.55)] hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-300 text-purple-50 font-medium text-xs sm:text-sm cursor-pointer group backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
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
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/70 group-hover:text-purple-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Continue with Apple */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('apple')}
              disabled={loadingProvider !== null}
              className="w-full max-w-[340px] flex items-center justify-between px-5 py-3 rounded-full bg-[#1d0e37]/75 hover:bg-[#28134a]/90 active:scale-[0.99] border border-purple-500/35 hover:border-purple-400/70 shadow-[0_4px_20px_rgba(0,0,0,0.55)] hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-300 text-purple-50 font-medium text-xs sm:text-sm cursor-pointer group backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                {loadingProvider === 'apple' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current text-purple-100" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-5.99-9.33-10.74-20.09-14.25-32.28-3.51-12.2-5.27-23.75-5.27-34.65 0-14.28 3.51-26.05 10.53-35.31 7.02-9.26 15.82-13.98 26.4-14.16 4.35 0 9.23 1.15 14.64 3.45 5.4 2.3 9.4 3.51 11.99 3.63 2.18-.24 6.37-1.5 12.57-3.79 6.2-2.3 11.45-3.37 15.77-3.23 12.08.62 21.6 4.7 28.56 12.25-10.53 6.38-15.66 15.35-15.39 26.92.27 9.17 3.86 16.92 10.77 23.25 4.35 4.01 9.49 6.75 15.42 8.22-2.3 7.06-5.31 14.65-9.04 22.77zM119.22 31.84c0-7.36 2.62-14.15 7.86-20.37 5.24-6.22 11.65-10.05 19.24-11.47.78 6.4-1.12 12.75-5.7 19.06-4.58 6.3-10.74 10.15-18.48 11.55-.44-.88-.7-1.74-.92-2.58-.22-.84-.33-1.68-.33-2.52l.33-6.25z" />
                  </svg>
                )}
                <span>{loadingProvider === 'apple' ? 'Summoning Apple...' : 'Continue with Apple'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/70 group-hover:text-purple-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* "or" Divider */}
            <span className="text-xs text-purple-300/50 font-sans my-1 select-none">or</span>

            {/* Sign up / Sign in with Email Pill */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setShowEmailForm(true);
              }}
              className="w-full max-w-[340px] flex items-center justify-center gap-2.5 px-5 py-3 rounded-full bg-[#130626]/40 hover:bg-[#20083d]/60 active:scale-[0.99] border border-purple-500/30 hover:border-purple-400/60 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all duration-300 text-purple-100 font-medium text-xs sm:text-sm cursor-pointer backdrop-blur-md"
            >
              <Mail className="w-4 h-4 text-purple-300/80" />
              <span>{mode === 'signup' ? 'Sign up with Email' : 'Sign in with Email'}</span>
            </button>

            {/* Bottom Account Switcher Link */}
            <div className="text-xs text-purple-300/60 pt-4">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signin');
                    }}
                    className="text-purple-300 font-semibold hover:text-white transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signup');
                    }}
                    className="text-purple-300 font-semibold hover:text-white transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {!isConfigured && (
              <p className="text-[10px] text-amber-300/70 max-w-[320px] pt-2">
                ⚙️ Supabase credentials pending in .env. Provider buttons invoke native client configuration.
              </p>
            )}
          </div>
        ) : (
          /* Email & Password Input View */
          <form
            onSubmit={handleEmailSubmit}
            className="w-full max-w-[340px] space-y-3 text-left animate-fadeIn"
          >
            {mode === 'signup' && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ghostly Moniker"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#1b0d34]/75 text-purple-100 placeholder-purple-400/40 text-xs sm:text-sm rounded-full border border-purple-500/35 hover:border-purple-400/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 pl-10 pr-4 py-3 outline-none transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)] backdrop-blur-md"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                placeholder="Spectral Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1b0d34]/75 text-purple-100 placeholder-purple-400/40 text-xs sm:text-sm rounded-full border border-purple-500/35 hover:border-purple-400/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 pl-10 pr-4 py-3 outline-none transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)] backdrop-blur-md"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Secret Cipher"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1b0d34]/75 text-purple-100 placeholder-purple-400/40 text-xs sm:text-sm rounded-full border border-purple-500/35 hover:border-purple-400/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 pl-10 pr-10 py-3 outline-none transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)] backdrop-blur-md"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'signup' && password && (
                <div className="pt-1 px-1">
                  <div className="h-1 w-full bg-[#16072b] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className="text-[10px] text-purple-400/70 block mt-0.5 text-right font-medium">
                    Rune Fortitude: {strength.text}
                  </span>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Secret Cipher"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#1b0d34]/75 text-purple-100 placeholder-purple-400/40 text-xs sm:text-sm rounded-full border border-purple-500/35 hover:border-purple-400/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 pl-10 pr-4 py-3 outline-none transition-all shadow-[0_4px_15px_rgba(0,0,0,0.4)] backdrop-blur-md"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 hover:from-purple-600 hover:to-violet-500 text-white font-medium text-xs sm:text-sm shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(192,132,252,0.65)] border border-purple-400/40 transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Summoning...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Inscribe Soul' : 'Cross the Threshold'}</span>
              )}
            </button>

            {/* Back to main pill view */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setShowEmailForm(false);
                }}
                className="text-purple-300/70 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to options
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }}
                className="text-purple-300 font-semibold hover:text-white transition-colors cursor-pointer"
              >
                {mode === 'signin' ? 'Need an account?' : 'Already enrolled?'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
