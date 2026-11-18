import React from 'react';
import { UserProfileCard } from '../components/dashboard/UserProfileCard';
import { GothicChatPreview } from '../components/dashboard/GothicChatPreview';
import { SupabaseDiagnostics } from '../components/dashboard/SupabaseDiagnostics';
import { OAuthSetupGuide } from '../components/dashboard/OAuthSetupGuide';
import { GothicBadge } from '../components/ui/GothicBadge';
import { Moon, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GothicBadge variant="purple" icon={<Sparkles className="w-3 h-3" />}>
              INNER SANCTUM
            </GothicBadge>
            <span className="text-xs text-purple-400/60 font-mono">Protected Route Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-wide">
            The Coven Chamber
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/70">
            Your authenticated spiritual sanctuary. Transmit whispers, inspect sessions, and maintain your conduits.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10071c] border border-purple-900/50 text-xs text-purple-300">
          <Moon className="w-4 h-4 text-purple-400" />
          <span>Witching Hour Active</span>
        </div>
      </div>

      {/* User Session Profile */}
      <UserProfileCard />

      {/* Main Social Messaging Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-white">Ghostly Transmissions</h2>
          <span className="text-xs text-purple-400/60">Real-time spectral socket feed</span>
        </div>
        <GothicChatPreview />
      </section>

      {/* Diagnostics and Conduits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SupabaseDiagnostics />
        <OAuthSetupGuide />
      </div>
    </div>
  );
};
