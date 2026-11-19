import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserPlus,
  Send,
  Ghost,
  Copy,
  Check,
  Lock,
  MessageSquare,
  Sparkles,
  Paperclip,
  CheckCheck,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { FriendEntry, Profile } from '../../types/profile';
import { fetchAcceptedFriends } from '../../lib/friendsService';
import { ensureProfile } from '../../lib/profileService';

interface GothicChatSectionProps {
  onNavigateToFriends?: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isSelf: boolean;
}

export const GothicChatSection: React.FC<GothicChatSectionProps> = ({
  onNavigateToFriends,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Active chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user profile & friends
  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      if (!user) return;
      const [pRes, fRes] = await Promise.all([
        ensureProfile(user),
        fetchAcceptedFriends(user.id),
      ]);
      if (!active) return;
      if (pRes.data) setProfile(pRes.data);
      if (fRes.data) {
        setFriends(fRes.data);
        if (fRes.data.length > 0 && !selectedFriendId) {
          setSelectedFriendId(fRes.data[0].friend.id);
        }
      }
      setLoading(false);
    };

    void fetchAll();
    const handleStorageUpdate = () => { void fetchAll(); };
    window.addEventListener('hauntly_storage_update', handleStorageUpdate);
    return () => {
      active = false;
      window.removeEventListener('hauntly_storage_update', handleStorageUpdate);
    };
  }, [user, selectedFriendId]);

  // Load messages for selected friend
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user || !selectedFriendId) {
        setMessages([]);
        return;
      }
      try {
        const storageKey = `hauntly_chat_${user.id}_${selectedFriendId}`;
        const saved = localStorage.getItem(storageKey);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch {
        setMessages([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, selectedFriendId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopyMyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.hauntly_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user || !selectedFriendId || !profile) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: profile.display_name || 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    const nextList = [...messages, newMsg];
    setMessages(nextList);
    setInputText('');

    try {
      const storageKey = `hauntly_chat_${user.id}_${selectedFriendId}`;
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (err) {
      console.warn('Failed to save message', err);
    }
  };

  const activeFriendEntry = friends.find((f) => f.friend.id === selectedFriendId);
  const activeFriend = activeFriendEntry?.friend;

  const filteredFriends = friends.filter((f) =>
    (f.friend.display_name || f.friend.username || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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

  // ══════════════════════════════════════════════════════════════════════
  // CASE 1: NO FRIENDS ADDED YET (Clear empty state requested by user)
  // ══════════════════════════════════════════════════════════════════════
  if (friends.length === 0) {
    return (
      <div className="flex-1 flex w-full h-full overflow-hidden select-none bg-[#0a0315]">
        {/* Messages Left Sidebar */}
        <div
          className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-r border-purple-900/30 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-white tracking-wide">Messages</h2>
              <span className="text-lg font-bold text-purple-400">(0)</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToFriends}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
              title="Add Friend by ID"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                disabled
                placeholder="No chats yet..."
                className="w-full bg-[#170a2f]/40 text-xs text-purple-400/40 placeholder-purple-400/30 rounded-xl pl-9 pr-3 py-2.5 outline-none border border-purple-900/30 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* Empty Sidebar Notice */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400/60 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <Ghost className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-purple-200 mb-1">Silence in the Crypt</p>
            <p className="text-[11px] text-purple-400/60 leading-relaxed max-w-[200px] mb-4">
              You haven&apos;t added any friends yet. Add a spirit by ID to start chatting.
            </p>
            <button
              type="button"
              onClick={onNavigateToFriends}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-800/50 hover:bg-purple-700/70 border border-purple-600/50 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend by ID</span>
            </button>
          </div>
        </div>

        {/* Center Main Stage (Empty State matching Hauntly Gothic UI) */}
        <div
          className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, #290b4d 0%, #15052b 50%, #0a0218 100%)',
          }}
        >
          {/* Ambient Glows */}
          <div className="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
            {/* Glowing Icon */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/60 flex items-center justify-center bg-purple-950/80"
                style={{
                  boxShadow:
                    '0 0 45px rgba(168,85,247,0.45), inset 0 0 20px rgba(168,85,247,0.2)',
                }}
              >
                <img
                  src="/hauntly-icon.png"
                  alt="Hauntly Realm"
                  className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 border-2 border-[#0a0218] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-serif font-black text-white tracking-wide mb-2">
              Your Coven is Quiet
            </h2>
            <p className="text-xs sm:text-sm text-purple-300/70 leading-relaxed mb-6 max-w-sm">
              No friends have been summoned to your messaging realm yet. Add a friend by their unique
              Hauntly ID to unlock private whispers and encrypted transmissions.
            </p>

            {/* User's Own Permanent Hauntly ID Card */}
            {profile && (
              <div
                className="w-full rounded-2xl border border-purple-800/40 p-4 mb-6 text-left"
                style={{ background: 'rgba(12,5,25,0.85)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Your Unique Hauntly ID</span>
                  </div>
                  <span className="text-[10px] text-purple-400/60 font-mono">Share with friends</span>
                </div>

                <div className="flex items-center gap-2 bg-[#070210] rounded-xl border border-purple-900/50 px-3.5 py-2.5">
                  <span className="text-purple-400 font-mono font-bold text-sm">#</span>
                  <span className="flex-1 font-mono text-sm text-white font-semibold tracking-wider select-all">
                    {profile.hauntly_id.toLowerCase()}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMyId}
                    title="Copy Hauntly ID"
                    className="flex items-center gap-1 text-xs text-purple-300 hover:text-white px-2 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={onNavigateToFriends}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-[0_0_25px_rgba(124,58,237,0.5)]"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Summon a Friend by ID 👻</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CASE 2: REAL FRIENDS ADDED (Live 1-on-1 chatting with real friends)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex w-full h-full overflow-hidden select-none bg-[#0a0315]">
      {/* ── Left Messages Column (Real Friends List) ── */}
      <div
        className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-r border-purple-900/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-white tracking-wide">Messages</h2>
            <span className="text-lg font-bold text-purple-400">({friends.length})</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToFriends}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
            title="Add Friend by ID"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-[#170a2f]/80 text-xs text-white placeholder-purple-400/40 rounded-xl pl-9 pr-3 py-2.5 outline-none border border-purple-900/40 focus:border-purple-600/60 transition-all font-medium"
            />
          </div>
        </div>

        {/* Friends Scroll List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 scrollbar-thin scrollbar-thumb-purple-900/40">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-purple-300/70">
            <span>Coven Whispers</span>
          </div>

          {filteredFriends.map((entry) => {
            const isSelected = selectedFriendId === entry.friend.id;
            const friendName = entry.friend.display_name || entry.friend.username || 'Spirit';
            return (
              <button
                key={entry.friend.id}
                type="button"
                onClick={() => setSelectedFriendId(entry.friend.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/50 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                    : 'hover:bg-purple-950/40 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={entry.friend.avatar_url || '/hauntly-icon.png'}
                    alt={friendName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-500/40"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hauntly-icon.png';
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#100522]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white truncate">{friendName}</span>
                    <span className="text-[10px] text-purple-400/60 font-mono">
                      #{entry.friend.hauntly_id.toLowerCase().slice(0, 9)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300/60 truncate">
                      @{entry.friend.username || 'spirit'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Center Chat Room with Active Friend ── */}
      {activeFriend ? (
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{
            background:
              'radial-gradient(circle at 60% 30%, #300c5c 0%, #1c0638 45%, #0e021e 85%, #080112 100%)',
          }}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-6 py-3.5 border-b border-purple-900/40 flex-shrink-0"
            style={{ background: 'rgba(18,7,38,0.7)', backdropFilter: 'blur(10px)' }}
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setShowRightPanel((prev) => !prev)}
              title="Toggle Friend Info"
            >
              <div className="relative">
                <img
                  src={activeFriend.avatar_url || '/hauntly-icon.png'}
                  alt={activeFriend.display_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/hauntly-icon.png';
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#120726]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {activeFriend.display_name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                  <span className="font-mono">#{activeFriend.hauntly_id.toLowerCase()}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Online</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRightPanel((prev) => !prev)}
              className="text-xs text-purple-300/70 hover:text-purple-200 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800/40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Profile Info</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showRightPanel ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-900/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-purple-300/60">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-white">Start the conversation</p>
                <p className="text-[11px] max-w-xs mt-1">
                  Send a private whisper to {activeFriend.display_name} across the shadows.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-purple-400/60 font-mono">{msg.time}</span>
                    <span className="text-[11px] font-semibold text-purple-200">
                      {msg.senderName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 max-w-[80%] sm:max-w-[70%]">
                    <div
                      className="px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed text-white"
                      style={{
                        background: msg.isSelf
                          ? 'linear-gradient(135deg, #6d28d9 0%, #581c87 100%)'
                          : 'linear-gradient(135deg, #4c1d95 0%, #3b0764 100%)',
                        boxShadow: '0 4px 20px rgba(109,40,217,0.3)',
                      }}
                    >
                      {msg.text}
                    </div>
                    {msg.isSelf && (
                      <CheckCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 self-end mb-1" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 pt-1 flex-shrink-0">
            <form
              onSubmit={handleSendMessage}
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
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Whisper to ${activeFriend.display_name}...`}
                className="flex-1 bg-transparent text-xs text-white placeholder-purple-400/40 outline-none font-medium"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
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
          Select a companion to begin whispers
        </div>
      )}

      {/* ── Right Panel (Active Friend's Profile Info) ── */}
      {showRightPanel && activeFriend && (
        <div
          className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-l border-purple-900/30 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #100522 0%, #0c031a 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide">Friend Info</h3>
            <button
              type="button"
              onClick={() => setShowRightPanel(false)}
              className="text-purple-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile details */}
          <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-6 scrollbar-thin scrollbar-thumb-purple-900/40">
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)] mb-3 bg-purple-950">
                <img
                  src={activeFriend.avatar_url || '/hauntly-icon.png'}
                  alt={activeFriend.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {activeFriend.display_name}
              </h2>
              <p className="text-xs text-purple-400 font-mono">@{activeFriend.username}</p>
              {activeFriend.bio && (
                <p className="text-[11px] text-purple-300/70 mt-2 max-w-[220px] leading-relaxed">
                  {activeFriend.bio}
                </p>
              )}
            </div>

            {/* Permanent ID */}
            <div
              className="rounded-xl border border-purple-800/40 p-3 space-y-1.5"
              style={{ background: 'rgba(12,5,25,0.85)' }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Hauntly ID</span>
              </div>
              <div className="flex items-center justify-between bg-[#070210] rounded-lg px-2.5 py-1.5 font-mono text-xs text-purple-200">
                <span>#{activeFriend.hauntly_id.toLowerCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeFriend.hauntly_id);
                  }}
                  title="Copy ID"
                  className="text-purple-400 hover:text-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
