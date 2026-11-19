import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Profile } from '../../types/profile';
import { ensureProfile } from '../../lib/profileService';
import { GothicCard } from '../ui/GothicCard';
import { GothicBadge } from '../ui/GothicBadge';
import { GothicButton } from '../ui/GothicButton';
import { HauntlyIdBadge } from '../profile/HauntlyIdBadge';
import { EditProfileModal } from '../profile/EditProfileModal';
import {
  Shield,
  Mail,
  Calendar,
  UserCheck,
  LogOut,
  CheckCircle,
  Flame,
  Edit3,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface UserProfileCardProps {
  onProfileLoaded?: (profile: Profile) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ onProfileLoaded }) => {
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    ensureProfile(user).then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('Error loading profile:', error.message);
      }
      if (data) {
        setProfile(data);
        if (onProfileLoaded) onProfileLoaded(data);
      }
      setLoadingProfile(false);
    });

    return () => {
      mounted = false;
    };
  }, [user, onProfileLoaded]);

  if (!user) return null;

  const provider = user.app_metadata.provider || 'email';
  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Mysterious Phantom';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const hauntlyId = profile?.hauntly_id;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Timeless eternity';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleProfileUpdated = (updated: Profile) => {
    setProfile(updated);
    if (onProfileLoaded) onProfileLoaded(updated);
  };

  return (
    <>
      <GothicCard glow className="w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-purple-900/40">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
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

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-white tracking-wide">{displayName}</h2>
                {profile?.username && (
                  <span className="text-xs font-mono text-purple-400/80 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-900/40">
                    @{profile.username}
                  </span>
                )}
                <GothicBadge
                  variant={provider === 'google' ? 'amber' : provider === 'apple' ? 'obsidian' : 'purple'}
                  icon={<Shield className="w-3 h-3" />}
                >
                  {provider.toUpperCase()} AUTH
                </GothicBadge>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-purple-300/70 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  {user.email || 'Spectral Identity'}
                </p>

                {hauntlyId && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-mono text-purple-400/60">ID:</span>
                    <HauntlyIdBadge hauntlyId={hauntlyId} size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center">
            {profile && (
              <GothicButton
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Vessel
              </GothicButton>
            )}

            <GothicButton
              variant="danger"
              size="sm"
              onClick={() => signOut()}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Extinguish Session
            </GothicButton>
          </div>
        </div>

        {/* Bio if set */}
        {profile?.bio && (
          <div className="pt-4 pb-2">
            <p className="text-xs text-purple-300/80 italic bg-purple-950/20 p-3 rounded-xl border border-purple-900/30">
              &ldquo;{profile.bio}&rdquo;
            </p>
          </div>
        )}

        {/* Soul Identity Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Soul Status
            </div>
            <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Bound &amp; Authenticated
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Unique Hauntly ID
            </div>
            <div className="text-xs font-mono text-purple-200">
              {loadingProfile ? (
                <span className="flex items-center gap-1 text-purple-400/60">
                  <Loader2 className="w-3 h-3 animate-spin" /> Inscribing...
                </span>
              ) : hauntlyId ? (
                <HauntlyIdBadge hauntlyId={hauntlyId} size="sm" />
              ) : (
                'Pending Setup'
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#120821]/60 border border-purple-900/30 space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-purple-400/60 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Awakening Epoch
            </div>
            <div className="text-xs text-purple-200">
              {formatDate(profile?.created_at || user.created_at)}
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

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
};
