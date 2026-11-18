import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GothicInput } from '../ui/GothicInput';
import { GothicButton } from '../ui/GothicButton';
import { SocialAuthButtons } from './SocialAuthButtons';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { text: 'Faint Spirit (Weak)', color: 'bg-rose-500', width: '25%' };
      case 2:
        return { text: 'Restless Ghost (Fair)', color: 'bg-amber-500', width: '50%' };
      case 3:
        return { text: 'Vengeful Wraith (Strong)', color: 'bg-purple-500', width: '75%' };
      case 4:
        return { text: 'Ancient Sovereign (Impenetrable)', color: 'bg-emerald-400', width: '100%' };
      default:
        return { text: 'Unsummoned', color: 'bg-purple-900', width: '5%' };
    }
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Please fill in all ritual components.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Cipher must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Cipher confirmations do not match across the ether.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await signUpWithEmail(email, password, displayName);
      if (error) {
        setErrorMessage(error.message);
      } else if (data?.user && !data.session) {
        // Supabase requires email verification
        setSuccessNotice(
          'A spiritual link has been dispatched to your email! Please verify your spectral address to complete the binding.'
        );
      } else {
        // Auto-confirmed or session established immediately
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ritual binding failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-950/70 border border-purple-700/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] text-purple-300 mb-1">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-serif">Join The Coven</h2>
        <p className="text-sm text-purple-300/70">
          Inscribe your spirit into the realm of Hauntly.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successNotice}</div>
        </div>
      )}

      {/* Social Auth Providers (Google & Apple) */}
      <SocialAuthButtons onAuthError={(msg) => setErrorMessage(msg)} />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-purple-900/50 w-full" />
        <span className="bg-[#0b0614] px-3 text-xs uppercase tracking-wider text-purple-400/50 font-medium shrink-0">
          or inscribe manually
        </span>
        <div className="border-t border-purple-900/50 w-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GothicInput
          label="Ghostly Moniker"
          type="text"
          placeholder="GrimReaper99 or LadyRaven"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="nickname"
        />

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

        <div className="space-y-1.5">
          <GothicInput
            label="Secret Cipher"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 mystical runes"
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
            autoComplete="new-password"
          />

          {password && (
            <div className="pt-1 space-y-1">
              <div className="h-1.5 w-full bg-[#140b24] rounded-full overflow-hidden border border-purple-950">
                <div
                  className={`h-full transition-all duration-500 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-[11px] text-purple-400/70 flex justify-between">
                <span>Rune Fortitude:</span>
                <span className="font-medium text-purple-300">{strength.text}</span>
              </p>
            </div>
          )}
        </div>

        <GothicInput
          label="Confirm Cipher"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter secret cipher"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
          autoComplete="new-password"
        />

        <p className="text-[11px] text-purple-400/50 leading-relaxed">
          By crossing into Hauntly, you agree to our Spectral Terms of Fellowship and our Phantom Privacy Rituals.
        </p>

        <GothicButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={loading}
        >
          Inscribe Soul
        </GothicButton>
      </form>

      <div className="text-center text-xs text-purple-300/60 pt-2">
        Already a familiar spirit?{' '}
        <Link to="/login" className="text-purple-400 hover:text-purple-200 font-medium underline underline-offset-4 decoration-purple-600/60">
          Enter the crypt
        </Link>
      </div>
    </div>
  );
};
