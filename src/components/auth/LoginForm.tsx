import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GothicInput } from '../ui/GothicInput';
import { GothicButton } from '../ui/GothicButton';
import { SocialAuthButtons } from './SocialAuthButtons';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both spectral address (email) and cipher (password).');
      return;
    }

    try {
      setLoading(true);
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMessage(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to cross the threshold. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] mb-1">
          <img src="/hauntly-icon.png" alt="Hauntly Icon" className="w-full h-full object-cover animate-ghostly-float" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-serif">Enter The Crypt</h2>
        <p className="text-sm text-purple-300/70">
          Reclaim your shadowy presence and reconnect with the coven.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Social Auth Providers (Google & Apple) */}
      <SocialAuthButtons onAuthError={(msg) => setErrorMessage(msg)} />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-purple-900/50 w-full" />
        <span className="bg-[#0b0614] px-3 text-xs uppercase tracking-wider text-purple-400/50 font-medium shrink-0">
          or whisper credentials
        </span>
        <div className="border-t border-purple-900/50 w-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GothicInput
          label="Spectral Email"
          type="email"
          placeholder="phantom@hauntly.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <GothicInput
          label="Secret Cipher"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-purple-200 transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-purple-300/70 hover:text-purple-200 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded bg-[#120821] border-purple-800/80 text-purple-600 focus:ring-purple-500/40"
              defaultChecked
            />
            <span>Remember essence</span>
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              setErrorMessage('Password recovery links are dispatched directly by Supabase Email Service.');
            }}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Forgot cipher?
          </a>
        </div>

        <GothicButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
        >
          Cross the Threshold
        </GothicButton>
      </form>

      <div className="text-center text-xs text-purple-300/60 pt-2">
        Not yet awakened into the realm?{' '}
        <Link to="/signup" className="text-purple-400 hover:text-purple-200 font-medium underline underline-offset-4 decoration-purple-600/60">
          Awaken an account
        </Link>
      </div>
    </div>
  );
};
