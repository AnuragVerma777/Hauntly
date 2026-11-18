import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GothicCard } from '../ui/GothicCard';
import { GothicBadge } from '../ui/GothicBadge';
import { GothicButton } from '../ui/GothicButton';
import { Shield, Mail, Calendar, Key, UserCheck, LogOut, CheckCircle, Flame } from 'lucide-react';

export const UserProfileCard: React.FC = () => {
  const { user, session, signOut } = useAuth();

  if (!user) return null;

  const provider = user.app_metadata.provider || 'email';
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Mysterious Phantom';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Timeless eternity';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <GothicCard glow className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-purple-900/40">
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-950 border-2 border-purple-500/60 flex items-center justify-center text-purple-200 text-2xl font-serif font-black shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0c0716] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-white tracking-wide">{displayName}</h2>
              <GothicBadge
                variant={provider === 'google' ? 'amber' : provider === 'apple' ? 'obsidian' : 'purple'}
                icon={<Shield className="w-3 h-3" />}
              >
                {provider.toUpperCase()} AUTH
              </GothicBadge>
            </div>
            <p className="text-sm text-purple-300/70 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              {user.email || 'Spectral Identity'}
            </p>
          </div>
        </div>

        <GothicButton
          variant="danger"
          size="sm"
          onClick={() => signOut()}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Extinguish Session
        </GothicButton>
      </div>

      {/* Soul Identity Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            Soul Status
          </div>
          <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Bound & Authenticated
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-purple-400" />
            Unique Spirit UID
          </div>
          <div className="text-xs font-mono text-purple-300 truncate" title={user.id}>
            {user.id}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            Awakening Epoch
          </div>
          <div className="text-xs text-purple-200">
            {formatDate(user.created_at)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            Session Persistence
          </div>
          <div className="text-xs text-purple-300">
            {session ? 'Active (Auto-refresh enabled)' : 'Ephemeral'}
          </div>
        </div>
      </div>
    </GothicCard>
  );
};
