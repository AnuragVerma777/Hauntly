import React, { useState } from 'react';
import type { Profile } from '../../types/profile';
import { updateProfile } from '../../lib/profileService';
import { GothicButton } from '../ui/GothicButton';
import { GothicInput } from '../ui/GothicInput';
import { HauntlyIdBadge } from './HauntlyIdBadge';
import {
  X,
  User,
  AtSign,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';

interface EditProfileModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (newProfile: Profile) => void;
}

const PRESET_AVATARS = [
  { label: 'Spectral Skull', url: '/hauntly-icon.png' },
  { label: 'Neon Ghost', url: '/ghost_isolated.png' },
  { label: 'Gothic Specter', url: '/ghost_character.png' },
  { label: 'Wandering Phantom', url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80' },
  { label: 'Midnight Raven', url: 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=150&auto=format&fit=crop&q=80' },
  { label: 'Moonlit Witch', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [bio, setBio] = useState(profile.bio || '');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const cleanDisplay = displayName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanDisplay) {
      setErrorMsg('Display name cannot be empty in the spirit realm.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMsg('Username must be between 3 and 30 characters.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await updateProfile(profile.id, {
        display_name: cleanDisplay,
        username: cleanUsername,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || undefined,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        setSuccessNotice('Profile vessel successfully fortified!');
        onUpdated(data);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#0e071a] border border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.3)] overflow-hidden space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/50">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Alter Spirit Vessel
            </h2>
            <p className="text-xs text-purple-300/60">
              Customize your persona, avatar visage, and public spectral handle
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/40 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permanent Hauntly ID Notice */}
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400/80 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-purple-400" />
              Permanent Hauntly ID
            </span>
            <p className="text-xs text-purple-200/70">
              Immutable soul identifier across all covens
            </p>
          </div>
          <HauntlyIdBadge hauntlyId={profile.hauntly_id} size="md" />
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Preview & Preset Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-purple-300/80">
              Avatar Visage
            </label>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Visage"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/70 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                    onError={() => setAvatarUrl('/hauntly-icon.png')}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-purple-900/60 border-2 border-purple-500/60 flex items-center justify-center text-purple-200 text-2xl font-serif font-black">
                    {displayName.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] text-purple-400/70 block">Select a gothic apparition:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.label}
                      className={`w-9 h-9 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        avatarUrl === preset.url
                          ? 'border-purple-400 ring-2 ring-purple-500/50 scale-105 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                          : 'border-purple-900/60 opacity-60 hover:opacity-100 hover:border-purple-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <GothicInput
              type="url"
              placeholder="Or paste custom image link (https://...)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              leftIcon={<ImageIcon className="w-4 h-4" />}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-purple-300/80">
              Display Name
            </label>
            <GothicInput
              type="text"
              placeholder="e.g. Lady of the Night"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />
          </div>

          {/* Username (@handle) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-purple-300/80">
              Moniker Handle (@)
            </label>
            <GothicInput
              type="text"
              placeholder="e.g. shadow_whisperer"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              leftIcon={<AtSign className="w-4 h-4" />}
              required
            />
            <p className="text-[11px] text-purple-400/60 font-mono">
              Unique across Hauntly (letters, numbers and underscores only, 3-30 chars)
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-purple-300/80">
              Spectral Bio (Lore)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-purple-400/60 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Share your haunting origin or nocturnal whispers..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                className="w-full pl-9 pr-3 py-2 text-xs text-purple-100 bg-[#090412]/80 border border-purple-800/40 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40 transition-all resize-none"
              />
            </div>
            <div className="text-right text-[10px] text-purple-400/50">
              {bio.length}/200
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/40">
            <GothicButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </GothicButton>

            <GothicButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            >
              {saving ? 'Fortifying...' : 'Save Transfiguration'}
            </GothicButton>
          </div>
        </form>
      </div>
    </div>
  );
};
