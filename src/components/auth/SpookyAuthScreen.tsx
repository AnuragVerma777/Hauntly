import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Moon,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SpookyAuthScreenProps {
  initialMode?: 'signin' | 'signup';
}

export const SpookyAuthScreen: React.FC<SpookyAuthScreenProps> = ({
  initialMode = 'signin',
}) => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State
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
          navigate('/profile');
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
          navigate('/profile');
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
      {/* Top Right Moon Icon */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30">
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[#1b0c33]/70 hover:bg-[#2a134d]/90 border border-purple-500/35 flex items-center justify-center text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.35)] transition-all cursor-pointer backdrop-blur-md"
          title="Nocturnal Mode Active"
        >
          <Moon className="w-4 h-4 fill-purple-300/40 text-purple-200" />
        </button>
      </div>

      {/* Center Branding & Form Container */}
      <div className="relative z-20 w-full max-w-[380px] flex flex-col items-center text-center animate-fadeIn">
        {/* Ghost Avatar */}
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

        {/* ── Email & Password Form ── */}
        <form
          onSubmit={handleEmailSubmit}
          className="w-full max-w-[340px] space-y-3.5 text-left animate-fadeIn"
        >
          {mode === 'signup' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Ghostly Moniker (Display Name)"
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
                placeholder="Secret Cipher (Password)"
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
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 hover:from-purple-600 hover:to-violet-500 text-white font-medium text-xs sm:text-sm shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(192,132,252,0.65)] border border-purple-400/40 transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                <span>Summoning...</span>
              </>
            ) : (
              <span>{mode === 'signup' ? 'Awaken Your Spirit' : 'Cross the Threshold'}</span>
            )}
          </button>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-2">
            <span className="text-xs text-purple-300/60">
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessNotice(null);
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              className="text-xs font-semibold text-purple-300 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
