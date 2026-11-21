import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Send,
  Copy,
  Check,
  Lock,
  MessageSquare,
  Sparkles,
  Paperclip,
  CheckCheck,
  X,
  ChevronRight,
  Users,
  AlertCircle,
  Mail,
  Ghost,
  Share2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { FriendEntry, Profile } from '../../types/profile';
import type { Group, GroupMember } from '../../types/groupChat';
import { fetchAcceptedFriends, fetchPendingRequests } from '../../lib/friendsService';
import { ensureProfile, searchByHauntlyId, getProfile } from '../../lib/profileService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { fetchUserGroups, fetchGroupMembers } from '../../lib/groupChatService';
import { GroupChatRoom } from './GroupChatRoom';
import { GroupInfoPanel } from './GroupInfoPanel';
import { CreateGroupModal } from './CreateGroupModal';
import { AiHelpSidebar } from './AiHelpSidebar';
import { MessageContextMenu } from './MessageContextMenu';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import {
  type ChatMessage,
  fetchDirectMessages,
  sendDirectMessage,
  deleteDirectMessage,
  subscribeToDirectWhispers,
} from '../../lib/whisperChatService';

interface GothicChatSectionProps {
  initialFriendId?: string;
  onNavigateToFriends?: () => void;
}

export interface CovenFriendItem {
  id: string;
  name: string;
  avatar: string;
  hauntlyId: string;
  username: string;
  bio?: string | null;
  status: 'invited' | 'accepted';
  time: string;
  unread?: number;
  online?: boolean;
}

export const GothicChatSection: React.FC<GothicChatSectionProps> = ({
  initialFriendId,
  onNavigateToFriends,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFriendId = initialFriendId || searchParams.get('friendId') || null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [covenFriends, setCovenFriends] = useState<CovenFriendItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab mode in chat: 'groups' | 'direct'
  const [chatType, setChatType] = useState<'groups' | 'direct'>('direct');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(urlFriendId);

  // Group members state for right panel
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Modals & Panels
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showDirectSummonModal, setShowDirectSummonModal] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1280 : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Real-time realm search across the internet
  const [realmSearchResult, setRealmSearchResult] = useState<Profile | null>(null);
  const [isSearchingRealm, setIsSearchingRealm] = useState(false);

  // Direct summon modal state
  const [summonQuery, setSummonQuery] = useState('');
  const [isSummonSearching, setIsSummonSearching] = useState(false);
  const [summonResult, setSummonResult] = useState<Profile | null>(null);
  const [summonSearchDone, setSummonSearchDone] = useState(false);
  const [summonError, setSummonError] = useState<string | null>(null);

  // Direct chat state
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [directInputText, setDirectInputText] = useState('');
  const directMessagesEndRef = useRef<HTMLDivElement>(null);

  // Right panel mode: 'info' | 'ai'
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'ai'>('info');
  const [aiSelectedText, setAiSelectedText] = useState<string>('');
  const [aiMode, setAiMode] = useState<'translate' | 'summarise' | 'rewrite' | 'replies'>('translate');

  // Direct chat context menu & delete states
  const [directContextMenu, setDirectContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
    messageText: string;
    isSelf: boolean;
  } | null>(null);
  const [directDeleteTarget, setDirectDeleteTarget] = useState<{
    messageId: string;
    messageText: string;
  } | null>(null);
  const [directToast, setDirectToast] = useState<string | null>(null);

  useEffect(() => {
    if (directToast) {
      const timer = setTimeout(() => setDirectToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [directToast]);

  // 1. Load initial user data, groups, and invited/accepted friends
  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      const currentId = user?.id || 'default_current_user';
      const [pRes, fRes, gRes, reqRes] = await Promise.all([
        user ? ensureProfile(user) : Promise.resolve({ data: null, error: null }),
        fetchAcceptedFriends(currentId),
        fetchUserGroups(currentId),
        fetchPendingRequests(currentId),
      ]);

      if (!active) return;
      if (pRes.data) setProfile(pRes.data);
      if (fRes.data) setFriends(fRes.data);
      if (gRes.data) setGroups(gRes.data);

      const items: CovenFriendItem[] = [];
      const seenIds = new Set<string>();

      // 1. Accepted Coven Friends
      if (fRes.data) {
        for (const entry of fRes.data) {
          if (entry.friend && !seenIds.has(entry.friend.id)) {
            seenIds.add(entry.friend.id);
            items.push({
              id: entry.friend.id,
              name: entry.friend.display_name,
              avatar: entry.friend.avatar_url || '/avatars/avatar_vampire.jpg',
              hauntlyId: entry.friend.hauntly_id,
              username: entry.friend.username,
              bio: entry.friend.bio,
              status: 'accepted',
              time: 'In Coven',
              online: true,
            });
          }
        }
      }

      // 2. Friends user is going to invite / has invited (pending outgoing requests)
      if (reqRes.sent) {
        for (const req of reqRes.sent) {
          const target = req.addressee;
          if (target && !seenIds.has(target.id)) {
            seenIds.add(target.id);
            items.push({
              id: target.id,
              name: target.display_name,
              avatar: target.avatar_url || '/avatars/avatar_pumpkin_face.jpg',
              hauntlyId: target.hauntly_id,
              username: target.username,
              bio: target.bio,
              status: 'invited',
              time: 'Invited',
              online: true,
            });
          }
        }
      }

      // If a specific friend ID was passed via props or URL (?friendId=...)
      if (urlFriendId) {
        const existing = items.find((f) => f.id === urlFriendId);
        if (existing) {
          setSelectedFriendId(urlFriendId);
          setChatType('direct');
        } else {
          // Look up profile to dynamically include them in direct whispers
          try {
            const { data: targetProfile } = await getProfile(urlFriendId);
            if (active && targetProfile) {
              const targetItem: CovenFriendItem = {
                id: targetProfile.id,
                name: targetProfile.display_name,
                avatar: targetProfile.avatar_url || '/avatars/avatar_vampire.jpg',
                hauntlyId: targetProfile.hauntly_id,
                username: targetProfile.username,
                bio: targetProfile.bio,
                status: 'invited',
                time: 'Active',
                online: true,
              };
              items.unshift(targetItem);
              setSelectedFriendId(targetProfile.id);
              setChatType('direct');
            }
          } catch (err) {
            console.warn('Failed to attune to URL friend ID', err);
          }
        }
      }

      setCovenFriends(items);

      if (!urlFriendId) {
        if (items.length > 0 && !selectedFriendId) {
          setSelectedFriendId(items[0].id);
          setChatType('direct');
        } else if (gRes.data && gRes.data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(gRes.data[0].id);
        }
      }
      setLoading(false);
    };

    void fetchAll();
    const handleStorageUpdate = () => {
      void fetchAll();
    };
    window.addEventListener('hauntly_storage_update', handleStorageUpdate);
    return () => {
      active = false;
      window.removeEventListener('hauntly_storage_update', handleStorageUpdate);
    };
  }, [user, selectedFriendId, selectedGroupId]);

  // 2. Load group members when selected group changes
  useEffect(() => {
    let active = true;
    if (!selectedGroupId) {
      setTimeout(() => {
        if (active) setGroupMembers([]);
      }, 0);
      return;
    }
    void fetchGroupMembers(selectedGroupId).then((res) => {
      if (active && res.data) setGroupMembers(res.data);
    });
    return () => {
      active = false;
    };
  }, [selectedGroupId]);

  // 3. Load direct messages for selected friend & subscribe to real-time whispers
  useEffect(() => {
    const currentUserId = user?.id || 'default_current_user';
    if (!selectedFriendId) {
      setDirectMessages([]);
      return;
    }

    let active = true;
    void fetchDirectMessages(currentUserId, selectedFriendId).then((msgs) => {
      if (active) setDirectMessages(msgs);
    });

    const unsubscribe = subscribeToDirectWhispers({
      userId1: currentUserId,
      userId2: selectedFriendId,
      onNewMessage: (msg) => {
        setDirectMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      onDeleteMessage: (deletedId) => {
        setDirectMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user, selectedFriendId]);

  // Scroll direct messages
  useEffect(() => {
    directMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  // Debounced live realm search across the internet when searching in chat
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setRealmSearchResult(null);
      setIsSearchingRealm(false);
      return;
    }

    // If an existing friend or group matches locally, don't show separate realm card
    const hasLocalMatch = covenFriends.some(
      (f) =>
        f.hauntlyId.toLowerCase() === query.toLowerCase() ||
        f.username.toLowerCase() === query.toLowerCase() ||
        f.name.toLowerCase() === query.toLowerCase()
    );
    if (hasLocalMatch) {
      setRealmSearchResult(null);
      setIsSearchingRealm(false);
      return;
    }

    let active = true;
    setIsSearchingRealm(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchByHauntlyId(query);
        if (active) {
          if (data && !covenFriends.some((f) => f.id === data.id)) {
            setRealmSearchResult(data);
          } else {
            setRealmSearchResult(null);
          }
        }
      } catch {
        if (active) setRealmSearchResult(null);
      } finally {
        if (active) setIsSearchingRealm(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, covenFriends]);

  const handleStartChatWithProfile = (targetProfile: Profile) => {
    setCovenFriends((prev) => {
      if (prev.some((f) => f.id === targetProfile.id)) return prev;
      return [
        {
          id: targetProfile.id,
          name: targetProfile.display_name,
          avatar: targetProfile.avatar_url || '/avatars/avatar_vampire.jpg',
          hauntlyId: targetProfile.hauntly_id,
          username: targetProfile.username,
          bio: targetProfile.bio,
          status: 'invited',
          time: 'Just now',
          online: true,
        },
        ...prev,
      ];
    });
    setSelectedFriendId(targetProfile.id);
    setChatType('direct');
    setSearchQuery('');
    setRealmSearchResult(null);
    setShowDirectSummonModal(false);
    setSummonResult(null);
    setSummonQuery('');
  };

  const handleExecuteSummon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = summonQuery.trim();
    if (!query) return;

    setIsSummonSearching(true);
    setSummonError(null);
    setSummonResult(null);
    setSummonSearchDone(false);

    try {
      const { data, error } = await searchByHauntlyId(query);
      if (error) {
        setSummonError(error.message);
      } else {
        setSummonResult(data);
      }
      setSummonSearchDone(true);
    } catch (err: unknown) {
      setSummonError(err instanceof Error ? err.message : 'Search failed across realm.');
    } finally {
      setIsSummonSearching(false);
    }
  };

  const getInviteUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hauntly-eight.vercel.app';
    const hauntId = profile?.hauntly_id || '';
    return `${origin}/profile?addFriend=${encodeURIComponent(hauntId)}`;
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(getInviteUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleShareInvite = async () => {
    const url = getInviteUrl();
    const shareData = {
      title: 'Whisper with me on Hauntly',
      text: `Join my Coven on Hauntly! Connect with me via ID #${profile?.hauntly_id.toLowerCase()}:`,
      url,
    };
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    handleCopyInviteLink();
  };

  const handleCopyMyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.hauntly_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendDirectMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentUserId = user?.id || 'default_current_user';
    const currentUserName = profile?.display_name || user?.email?.split('@')[0] || 'You';
    if (!directInputText.trim() || !selectedFriendId) return;

    const text = directInputText.trim();
    setDirectInputText('');

    try {
      const sent = await sendDirectMessage({
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: selectedFriendId,
        text,
      });

      setDirectMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      // Interactive Demo Companion Auto-Reply (e.g. Vlad, Jack, Luna, Frank, Casper, or demo mode)
      const seedIds = ['usr_vlad', 'usr_jack', 'usr_luna', 'usr_frank', 'usr_casper'];
      const isSeedCompanion = seedIds.includes(selectedFriendId);
      if (isSeedCompanion || !isSupabaseConfigured) {
        setTimeout(async () => {
          const replies = [
            "I received your whisper through the ethereal fog! 🕯️",
            "The shadows stir... All Hallows' Eve approaches! 🦇",
            "Greetings, noble soul. Your message echoes in my sanctuary. 🔮",
            "By the crimson moon, we shall convene tonight!",
            "Hauntly connects our spirits across the veil. ✨",
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replySenderName = activeFriend?.display_name || 'Companion Spirit';

          const replyMsg = await sendDirectMessage({
            senderId: selectedFriendId,
            senderName: replySenderName,
            receiverId: currentUserId,
            text: randomReply,
          });

          setDirectMessages((prev) => {
            if (prev.some((m) => m.id === replyMsg.id)) return prev;
            return [...prev, replyMsg];
          });
        }, 1200);
      }
    } catch (err) {
      console.warn('Failed to send direct whisper', err);
    }
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroupId(newGroup.id);
    setChatType('groups');
  };

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const activeFriendItem =
    covenFriends.find((c) => c.id === selectedFriendId) || covenFriends[0] || null;
  const activeFriend: Profile | null = activeFriendItem
    ? {
        id: activeFriendItem.id,
        hauntly_id: activeFriendItem.hauntlyId,
        username: activeFriendItem.username,
        display_name: activeFriendItem.name,
        avatar_url: activeFriendItem.avatar,
        bio:
          activeFriendItem.bio ||
          (activeFriendItem.status === 'invited' ? 'Invited to your coven' : 'In your coven'),
        created_at: '2026-10-31T00:00:00.000Z',
        updated_at: '2026-10-31T00:00:00.000Z',
      }
    : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0315] text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
          <p className="text-xs font-mono text-purple-400/60">Attuning to the ethereal realm...</p>
        </div>
      </div>
    );
  }

  // Check if user has no groups and no invited friends
  const hasNoContent = groups.length === 0 && covenFriends.length === 0;

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCovenFriends = covenFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.hauntlyId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden select-none bg-[#0a0315]">
      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 1: MESSAGES LIST (Only Invited Friends & Coven)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-r border-purple-900/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
      >
        {/* Header with Title and Compose / Summon Buttons */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-white tracking-wide">Messages</h2>
            <span className="text-lg font-bold text-purple-400">
              ({covenFriends.length + groups.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDirectSummonModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-[#d4ff32] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-purple-700/50 shadow-[0_0_12px_rgba(212,255,50,0.15)]"
              title="Summon / message friend by ID or @username"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Whisper</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/50 transition-all cursor-pointer border border-purple-800/40"
              title="Create new Coven circle (group chat)"
            >
              <Users className="w-4 h-4 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Your Permanent ID & Instant Share Bar */}
        {profile && (
          <div className="mx-5 mb-3 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <span className="text-[9px] font-mono text-purple-400/80 block leading-tight">YOUR HAUNTLY ID</span>
              <span className="text-xs font-mono font-bold text-[#d4ff32] truncate block">
                #{profile.hauntly_id.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyMyId}
                className="px-2 py-0.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy my Hauntly ID"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareInvite}
                className="p-1 rounded-lg bg-[#d4ff32] hover:bg-[#bbf019] text-black cursor-pointer transition-colors shadow-sm"
                title="Share your permanent invite link across the web"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-950" /> : <Share2 className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pb-3 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, @username or chat..."
              className="w-full bg-[#170a2f]/80 text-xs text-white placeholder-purple-400/40 rounded-xl pl-9 pr-3 py-2 outline-none border border-purple-900/40 focus:border-[#d4ff32]/60 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Searching Realm indicator */}
          {isSearchingRealm && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-purple-300">
              <Loader2 className="w-3 h-3 animate-spin text-[#d4ff32]" />
              <span>Locating spirit across the internet...</span>
            </div>
          )}

          {/* Instant Summon Result Card from Realm Search */}
          {realmSearchResult && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-[#d4ff32]/50 shadow-[0_0_15px_rgba(212,255,50,0.2)] space-y-1.5 animate-fadeIn">
              <span className="text-[9px] font-mono font-bold text-[#d4ff32] uppercase tracking-wider block">
                ✨ Companion Found Online
              </span>
              <div className="flex items-center gap-2">
                <img
                  src={realmSearchResult.avatar_url || '/avatars/avatar_vampire.jpg'}
                  alt={realmSearchResult.display_name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#d4ff32]/60 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{realmSearchResult.display_name}</p>
                  <p className="text-[10px] font-mono text-purple-300/70 truncate">#{realmSearchResult.hauntly_id.toLowerCase()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartChatWithProfile(realmSearchResult)}
                  className="px-2.5 py-1 rounded-lg bg-[#d4ff32] hover:bg-[#bbf019] text-black text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Whisper
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scroll List: Only Groups & Invited Friends */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 scrollbar-thin scrollbar-thumb-purple-900/40">
          {/* ── 1. CIRCLES & COVENS (Groups) ── */}
          {filteredGroups.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <span className="text-[11px] font-semibold text-purple-300/70 tracking-wider">
                  Circles & Covens
                </span>
                <span className="text-[10px] font-mono text-purple-400/60">{filteredGroups.length}</span>
              </div>

              {filteredGroups.map((grp) => {
                const isSelected = chatType === 'groups' && selectedGroupId === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => {
                      setChatType('groups');
                      setSelectedGroupId(grp.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/50 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                        : 'hover:bg-purple-950/40 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={grp.avatar_url || '/avatars/avatar_pumpkin_face.jpg'}
                        alt={grp.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-purple-500/40"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-white truncate">{grp.name}</span>
                      </div>
                      <span className="text-[11px] text-purple-300/60 truncate block">
                        {grp.description || 'Active circle'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── 2. INVITED FRIENDS & COVEN ── */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <span className="text-[11px] font-semibold text-purple-300/70 tracking-wider">
                Invited Friends
              </span>
              <span className="text-[10px] font-mono text-purple-400/60">
                {filteredCovenFriends.length}
              </span>
            </div>

            {filteredCovenFriends.length > 0 ? (
              filteredCovenFriends.map((friend) => {
                const isSelected = chatType === 'direct' && selectedFriendId === friend.id;
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => {
                      setChatType('direct');
                      setSelectedFriendId(friend.id);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/50 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                        : 'hover:bg-purple-950/40 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-500/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/avatar_vampire.jpg';
                        }}
                      />
                      {friend.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#100522]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-white truncate">{friend.name}</span>
                        {friend.status === 'invited' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                            <Mail className="w-2.5 h-2.5" /> Invited
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            🕯️ In Coven
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-purple-300/60 font-mono truncate">
                          #{friend.hauntlyId.toLowerCase()}
                        </span>
                        <span className="text-[10px] text-purple-400/50 font-mono shrink-0 ml-1">
                          @{friend.username}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/30 text-center space-y-2 my-2">
                <div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Ghost className="w-5 h-5 text-[#d4ff32]" />
                </div>
                <div>
                  <p className="text-xs text-white font-semibold">No friends invited yet</p>
                  <p className="text-[10px] text-purple-400/60 leading-relaxed mt-0.5">
                    Only friends you summon or invite to your coven will appear here.
                  </p>
                </div>
                {onNavigateToFriends && (
                  <button
                    type="button"
                    onClick={onNavigateToFriends}
                    className="px-3 py-1.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] text-black text-[11px] font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1 mt-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Summon Friends</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 2: MAIN CHAT ROOM (Group Realtime Room OR Direct Whispers)
      ══════════════════════════════════════════════════════════════════ */}
      {hasNoContent ? (
        /* Empty State across realm */
        <div
          className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden text-center"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, #290b4d 0%, #15052b 50%, #0a0218 100%)',
          }}
        >
          <div className="relative mb-6">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/60 flex items-center justify-center bg-purple-950/80 shadow-[0_0_45px_rgba(168,85,247,0.45)]"
            >
              <img src="/hauntly-icon.png" alt="Hauntly" className="w-16 h-16 object-contain" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 border-2 border-[#0a0218] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-serif font-black text-white tracking-wide mb-2">
            Your Coven is Quiet
          </h2>
          <p className="text-xs sm:text-sm text-purple-300/70 leading-relaxed mb-6 max-w-sm">
            Form a coven group or add a companion using their permanent Hauntly ID to begin real-time
            encrypted conversations.
          </p>

          {profile && (
            <div
              className="w-full max-w-xs rounded-2xl border border-purple-800/40 p-4 mb-6 text-left"
              style={{ background: 'rgba(12,5,25,0.85)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-300">Your Hauntly ID</span>
                <span className="text-[10px] text-purple-400/60 font-mono">Share with friends</span>
              </div>
              <div className="flex items-center gap-2 bg-[#070210] rounded-xl border border-purple-900/50 px-3 py-2">
                <span className="text-purple-400 font-mono font-bold text-sm">#</span>
                <span className="flex-1 font-mono text-sm text-white font-semibold tracking-wider select-all">
                  {profile.hauntly_id.toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMyId}
                  className="text-xs text-purple-300 hover:text-white px-2 py-1 rounded bg-purple-900/40 transition-colors cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
            >
              <Users className="w-4 h-4" />
              <span>Form Coven Group</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToFriends}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-purple-200 border border-purple-700/50 hover:bg-purple-900/40 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend by ID</span>
            </button>
          </div>
        </div>
      ) : chatType === 'groups' && activeGroup && profile ? (
        /* Real-Time WhatsApp-style Group Chat Room */
        <GroupChatRoom
          key={activeGroup.id}
          group={activeGroup}
          currentUser={profile}
          showInfoPanel={showRightPanel && rightPanelTab === 'info'}
          onToggleInfo={() => {
            if (showRightPanel && rightPanelTab === 'info') {
              setShowRightPanel(false);
            } else {
              setRightPanelTab('info');
              setShowRightPanel(true);
            }
          }}
          onToggleAiHelp={() => {
            if (showRightPanel && rightPanelTab === 'ai') {
              setShowRightPanel(false);
            } else {
              setRightPanelTab('ai');
              setShowRightPanel(true);
            }
          }}
          onOpenAiHelp={(text, mode) => {
            setAiSelectedText(text);
            setAiMode(mode);
            setRightPanelTab('ai');
            setShowRightPanel(true);
          }}
          onViewOnGlobe={(_lat, _lng, locId) => {
            navigate(`/globe?groupId=${activeGroup.id}&locationId=${locId}`);
          }}
        />
      ) : chatType === 'direct' && activeFriend ? (
        /* Direct 1-on-1 Whispers Room */
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{
            background:
              'radial-gradient(circle at 60% 30%, #300c5c 0%, #1c0638 45%, #0e021e 85%, #080112 100%)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-3.5 border-b border-purple-900/40 flex-shrink-0"
            style={{ background: 'rgba(18,7,38,0.7)', backdropFilter: 'blur(10px)' }}
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowRightPanel((prev) => !prev)}
            >
              <div className="relative">
                <img
                  src={activeFriend.avatar_url || '/hauntly-icon.png'}
                  alt={activeFriend.display_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#120726]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {activeFriend.display_name}
                  </h3>
                  {activeFriendItem?.status === 'invited' ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                      <Mail className="w-2.5 h-2.5" /> Invited Friend
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      🕯️ In Coven
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                  <span className="font-mono">#{activeFriend.hauntly_id.toLowerCase()}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (showRightPanel && rightPanelTab === 'ai') {
                    setShowRightPanel(false);
                  } else {
                    setRightPanelTab('ai');
                    setAiSelectedText(
                      directMessages[directMessages.length - 1]?.text ||
                        "Let's meet at the haunted castle tonight!"
                    );
                    setShowRightPanel(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 border border-purple-600/40 text-purple-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Open Spectral AI Help"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
                <span className="hidden sm:inline">AI Help</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showRightPanel && rightPanelTab === 'info') {
                    setShowRightPanel(false);
                  } else {
                    setRightPanelTab('info');
                    setShowRightPanel(true);
                  }
                }}
                className="text-xs text-purple-300/70 hover:text-purple-200 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Profile Info</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showRightPanel && rightPanelTab === 'info' ? 'rotate-90' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-900/30">
            {directMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-purple-300/60">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-white">Start the whisper</p>
                <p className="text-[11px] max-w-xs mt-1">
                  Send a private whisper to {activeFriend.display_name} across the shadows.
                </p>
              </div>
            ) : (
              directMessages.map((msg) => {
                const currentUserId = user?.id || 'default_current_user';

                // 1. Explicit check: if sender is the selected friend, it is 100% NOT my message (LEFT)
                const isFromFriend =
                  Boolean(selectedFriendId && msg.senderId === selectedFriendId) ||
                  Boolean(activeFriend && msg.senderName && msg.senderName.toLowerCase() === activeFriend.display_name.toLowerCase());

                // 2. Sent by me: if receiver is the friend, or sender is currentUserId (and not friend)
                const isMyMessage: boolean =
                  !isFromFriend &&
                  (
                    Boolean(selectedFriendId && msg.receiverId === selectedFriendId) ||
                    Boolean(currentUserId && msg.senderId === currentUserId && msg.senderId !== selectedFriendId) ||
                    msg.senderName === 'You' ||
                    Boolean(msg.isSelf && !msg.senderId)
                  );

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} gap-1`}
                  >
                    <div className={`flex items-center gap-1.5 px-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[11px] font-semibold text-purple-200">
                        {isMyMessage ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[10px] text-purple-400/60 font-mono">{msg.time}</span>
                    </div>
                    <div className={`flex items-end gap-2 max-w-[80%] sm:max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMyMessage && activeFriend && (
                        <img
                          src={activeFriend.avatar_url || '/hauntly-icon.png'}
                          alt={activeFriend.display_name}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-500/40 shrink-0 mb-1"
                        />
                      )}
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDirectContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            messageId: msg.id,
                            messageText: msg.text,
                            isSelf: isMyMessage,
                          });
                        }}
                        className="px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed text-white cursor-context-menu"
                        style={{
                          background: isMyMessage
                            ? 'linear-gradient(135deg, #6d28d9 0%, #581c87 100%)'
                            : 'linear-gradient(135deg, #37125a 0%, #200638 100%)',
                          border: isMyMessage ? 'none' : '1px solid rgba(147, 51, 234, 0.3)',
                          boxShadow: isMyMessage
                            ? '0 4px 20px rgba(109,40,217,0.3)'
                            : '0 4px 15px rgba(0,0,0,0.4)',
                        }}
                        title="Right-click for options"
                      >
                        {msg.text}
                      </div>
                      {isMyMessage && (
                        <CheckCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 self-end mb-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={directMessagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 pt-1 flex-shrink-0">
            <form
              onSubmit={handleSendDirectMessage}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-purple-700/40"
              style={{
                background: 'rgba(14,5,30,0.9)',
                boxShadow: '0 0 25px rgba(124,58,237,0.2)',
              }}
            >
              <button
                type="button"
                className="text-purple-400 hover:text-purple-200 transition-colors cursor-pointer shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 rotate-45" />
              </button>

              <input
                type="text"
                value={directInputText}
                onChange={(e) => setDirectInputText(e.target.value)}
                placeholder={`Whisper to ${activeFriend.display_name}...`}
                className="flex-1 bg-transparent text-xs text-white placeholder-purple-400/40 outline-none font-medium"
              />

              <button
                type="submit"
                disabled={!directInputText.trim()}
                className="w-7 h-7 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0e021e] text-purple-400/60 text-xs font-mono">
          Select a coven group or companion to enter the chat room
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 3: GROUP INFO OR AI HELP RIGHT PANEL
      ══════════════════════════════════════════════════════════════════ */}
      {showRightPanel && (
        rightPanelTab === 'ai' ? (
          <AiHelpSidebar
            selectedText={
              aiSelectedText ||
              (activeGroup?.last_message?.content ||
                directMessages[directMessages.length - 1]?.text ||
                "Let's meet at the haunted castle tonight!")
            }
            initialMode={aiMode}
            onClose={() => setShowRightPanel(false)}
            onInsertIntoChat={(text) => {
              if (chatType === 'direct') {
                setDirectInputText((prev) => (prev ? `${prev} ${text}` : text));
              } else {
                window.dispatchEvent(
                  new CustomEvent('hauntly_insert_chat_text', { detail: { text } })
                );
              }
            }}
          />
        ) : chatType === 'groups' && activeGroup && user ? (
          <GroupInfoPanel
            group={activeGroup}
            members={groupMembers}
            currentUserId={user.id}
            friends={friends}
            onClose={() => setShowRightPanel(false)}
            onMembersUpdated={() => {
              void fetchGroupMembers(activeGroup.id).then((res) => {
                if (res.data) setGroupMembers(res.data);
              });
            }}
          />
        ) : chatType === 'direct' && activeFriend ? (
          <div
            className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-l border-purple-900/30 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-purple-900/30">
              <h3 className="text-sm font-bold text-white tracking-wide">Spirit Info</h3>
              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="w-7 h-7 rounded-full bg-purple-950/60 text-purple-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-purple-500/60 mb-3 bg-purple-950">
                  <img
                    src={activeFriend.avatar_url || '/hauntly-icon.png'}
                    alt={activeFriend.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-1 justify-center">
                  <h2 className="text-base font-bold text-white">{activeFriend.display_name}</h2>
                  {activeFriendItem?.status === 'invited' ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Invited
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      In Coven
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-400 font-mono">@{activeFriend.username}</p>
                {activeFriend.bio && (
                  <p className="text-[11px] text-purple-300/70 mt-2">{activeFriend.bio}</p>
                )}
              </div>
              <div className="rounded-xl border border-purple-800/40 p-3 space-y-1 bg-[#0c0519]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hauntly ID</span>
                </div>
                <p className="font-mono text-xs text-purple-200">#{activeFriend.hauntly_id.toLowerCase()}</p>
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* ── Direct Chat Message Context Menu ── */}
      {directContextMenu && (
        <MessageContextMenu
          position={{ x: directContextMenu.x, y: directContextMenu.y }}
          messageId={directContextMenu.messageId}
          messageText={directContextMenu.messageText}
          isSelf={directContextMenu.isSelf}
          onClose={() => setDirectContextMenu(null)}
          onDeleteRequest={(id, text) => {
            setDirectDeleteTarget({ messageId: id, messageText: text });
          }}
          onCopyRequest={(text) => {
            navigator.clipboard.writeText(text);
            setDirectToast('Message copied!');
          }}
          onAiTranslateRequest={(text) => {
            setAiSelectedText(text);
            setAiMode('translate');
            setRightPanelTab('ai');
            setShowRightPanel(true);
          }}
          onAiSummariseRequest={(text) => {
            setAiSelectedText(text);
            setAiMode('summarise');
            setRightPanelTab('ai');
            setShowRightPanel(true);
          }}
          onAiRewriteRequest={(text) => {
            setAiSelectedText(text);
            setAiMode('rewrite');
            setRightPanelTab('ai');
            setShowRightPanel(true);
          }}
          onAiRepliesRequest={(text) => {
            setAiSelectedText(text);
            setAiMode('replies');
            setRightPanelTab('ai');
            setShowRightPanel(true);
          }}
        />
      )}

      {/* ── Direct Delete Confirmation Dialog ── */}
      {directDeleteTarget && (
        <DeleteConfirmationModal
          isOpen={Boolean(directDeleteTarget)}
          messageText={directDeleteTarget.messageText}
          isDeleting={false}
          onConfirm={async () => {
            const currentUserId = user?.id || 'default_current_user';
            if (selectedFriendId) {
              await deleteDirectMessage({
                messageId: directDeleteTarget.messageId,
                userId1: currentUserId,
                userId2: selectedFriendId,
                currentUserId,
              });
            }
            setDirectMessages((prev) =>
              prev.filter((m) => m.id !== directDeleteTarget.messageId)
            );
            setDirectToast('Message banished forever.');
            setDirectDeleteTarget(null);
          }}
          onCancel={() => setDirectDeleteTarget(null)}
        />
      )}

      {/* ── Direct Toast Notification ── */}
      {directToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2.5 rounded-2xl bg-[#1b122e] border border-purple-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(168,85,247,0.35)] text-white text-xs font-semibold flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{directToast}</span>
        </div>
      )}

      {/* ── CREATE GROUP MODAL ── */}
      {showCreateGroupModal && user && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          creatorId={user.id}
          friends={friends}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {/* ── DIRECT WHISPER / SUMMON COMPANION MODAL ── */}
      {showDirectSummonModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-6 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-5 text-white relative"
            style={{ background: 'linear-gradient(180deg, #18092f 0%, #0c031a 100%)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-900/50 flex items-center justify-center text-[#d4ff32] border border-purple-700/50">
                  <Ghost className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Start Direct Whisper</h3>
                  <p className="text-[10px] text-purple-300/60 font-mono">Connect across the internet by ID or handle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDirectSummonModal(false);
                  setSummonResult(null);
                  setSummonError(null);
                  setSummonQuery('');
                }}
                className="w-7 h-7 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleExecuteSummon} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Hauntly ID (e.g. #HAUNT-8X29K, 8X29K) or @username"
                  value={summonQuery}
                  onChange={(e) => setSummonQuery(e.target.value)}
                  className="w-full bg-[#120524] text-xs text-white placeholder-purple-400/40 rounded-xl px-4 py-3 outline-none border border-purple-800/60 focus:border-[#d4ff32] transition-all font-medium pr-10"
                  autoFocus
                />
                {summonQuery && (
                  <button
                    type="button"
                    onClick={() => setSummonQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!summonQuery.trim() || isSummonSearching}
                  className="flex-1 py-2.5 rounded-xl bg-[#d4ff32] hover:bg-[#bbf019] disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(212,255,50,0.3)]"
                >
                  {isSummonSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Locate Companion</span>
                </button>
              </div>
            </form>

            {/* Error / Not found message */}
            {summonError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{summonError}</span>
              </div>
            )}

            {summonSearchDone && !summonResult && !isSummonSearching && !summonError && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  No companion found for &quot;{summonQuery}&quot;
                </p>
                <p className="text-[11px] text-purple-300/70">
                  Check their exact Hauntly ID or share your invite link so they can add you directly.
                </p>
              </div>
            )}

            {/* Found Companion Card */}
            {summonResult && (
              <div className="p-4 rounded-2xl bg-[#120524] border border-[#d4ff32]/40 shadow-lg space-y-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <img
                    src={summonResult.avatar_url || '/avatars/avatar_vampire.jpg'}
                    alt={summonResult.display_name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#d4ff32]/60"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{summonResult.display_name}</h4>
                    <p className="text-xs font-mono text-purple-300/80">@{summonResult.username}</p>
                    <p className="text-[10px] font-mono text-[#d4ff32] font-semibold">
                      #{summonResult.hauntly_id.toLowerCase()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartChatWithProfile(summonResult)}
                  className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_18px_rgba(168,85,247,0.4)]"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4ff32]" />
                  <span>Start Whisper Now</span>
                </button>
              </div>
            )}

            {/* Quick Share My Link in modal */}
            {profile && (
              <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between text-xs text-purple-300/70">
                <span>Or send them your link:</span>
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="text-xs text-[#d4ff32] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share My Invite Link</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
