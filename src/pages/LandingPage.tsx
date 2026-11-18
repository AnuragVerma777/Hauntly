import React from 'react';
import { Link } from 'react-router-dom';
import { Ghost, Moon, Shield, Sparkles, MessageSquare, Flame, Lock, ChevronRight, Eye } from 'lucide-react';
import { GothicButton } from '../components/ui/GothicButton';
import { GothicCard } from '../components/ui/GothicCard';
import { GothicBadge } from '../components/ui/GothicBadge';
import { OAuthSetupGuide } from '../components/dashboard/OAuthSetupGuide';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-10">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center pt-8 md:pt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-700/50 text-purple-300 text-xs font-medium mb-6 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>The Nocturnal Social Messaging Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Where Spirits Converse in the{' '}
          <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            Shadows
          </span>
        </h1>

        <p className="text-base sm:text-lg text-purple-200/70 max-w-2xl mx-auto leading-relaxed mb-10 font-sans">
          Step beyond the mortal threshold. Hauntly is an ethereal messaging realm cloaked in perpetual night, fortified by Supabase authentication and crafted for midnight communion.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link to="/signup" className="w-full sm:w-auto">
            <GothicButton variant="primary" size="lg" className="w-full" rightIcon={<ChevronRight className="w-4 h-4" />}>
              Awaken an Account
            </GothicButton>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <GothicButton variant="secondary" size="lg" className="w-full" leftIcon={<Ghost className="w-4 h-4 text-purple-300" />}>
              Enter Crypt
            </GothicButton>
          </Link>
        </div>

        {/* Floating Gothic Visual Teaser */}
        <div className="mt-16 max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-35 transition-opacity duration-700" />
          
          <div className="relative rounded-2xl bg-[#0d0716]/90 border border-purple-800/50 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-purple-400/60 ml-2">hauntly-session://séance.v1</span>
              </div>
              <GothicBadge variant="purple" icon={<Ghost className="w-3 h-3" />}>
                VEIL OPEN
              </GothicBadge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-[#140b24]/60 border border-purple-900/40">
                <div className="w-7 h-7 rounded-lg overflow-hidden mb-2 border border-purple-500/40 shadow-sm">
                  <img src="/hauntly-icon.png" alt="Hauntly" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-serif font-bold text-white text-sm">Supabase OAuth</h4>
                <p className="text-xs text-purple-300/70 mt-1">
                  Seamless Google, Apple, and Email/Password authentication with zero credential leakage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#140b24]/60 border border-purple-900/40">
                <Lock className="w-5 h-5 text-purple-400 mb-2" />
                <h4 className="font-serif font-bold text-white text-sm">Session Fortitude</h4>
                <p className="text-xs text-purple-300/70 mt-1">
                  Automatic token refresh, persistent sessions across reloads and multi-tab synchronization.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#140b24]/60 border border-purple-900/40">
                <Moon className="w-5 h-5 text-purple-400 mb-2" />
                <h4 className="font-serif font-bold text-white text-sm">Gothic Sanctum</h4>
                <p className="text-xs text-purple-300/70 mt-1">
                  Obsidian palettes, violet spectral radiance, arcane typography, and atmospheric glow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <GothicBadge variant="purple">SPECTRAL POWERS</GothicBadge>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Constructed For The Nocturnal Soul
          </h2>
          <p className="text-sm text-purple-300/70 max-w-xl mx-auto">
            Every fiber of Hauntly is forged with eerie refinement, unwavering security and social warmth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Coven Channels</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Create and congregate inside dark rooms named after ancient crypts, catacombs, and occult gatherings.
            </p>
          </GothicCard>

          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Ghost className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Vanishing Whispers</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Direct communications that dissolve into thin air like morning mist after read confirmation.
            </p>
          </GothicCard>

          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Official Supabase Vault</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Strict client integration ensuring Service Role keys and OAuth secrets remain inaccessible to unauthorized eyes.
            </p>
          </GothicCard>

          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Google & Apple OAuth</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Universal sign-in powered by Supabase federated OAuth, allowing one-tap cross-device entry.
            </p>
          </GothicCard>

          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Zero Daylight Architecture</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              Curated for high contrast night viewing, avoiding harsh eye fatigue during late nocturnal brainstorming.
            </p>
          </GothicCard>

          <GothicCard glow className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-white text-lg">Runes & Spectral Reactions</h3>
            <p className="text-xs text-purple-300/70 leading-relaxed">
              React to transmissions with glowing spirits, mystical runes, spectral bats, and eerie flames.
            </p>
          </GothicCard>
        </div>
      </section>

      {/* Embedded OAuth Setup Guide for Instant Developer Convenience */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <OAuthSetupGuide />
      </section>

      {/* Call To Action */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-b from-purple-950/80 via-[#10071c] to-[#08030f] border border-purple-700/50 p-8 sm:p-12 text-center overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.25)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-4">
            The Gates Stand Ajar
          </h2>
          <p className="text-sm sm:text-base text-purple-200/70 max-w-xl mx-auto mb-8">
            Create your ghostly moniker or summon your presence with Google and Apple authentication now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <GothicButton variant="primary" size="lg">
                Enter The Coven
              </GothicButton>
            </Link>
            <Link to="/login">
              <GothicButton variant="secondary" size="lg">
                Sign In
              </GothicButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
