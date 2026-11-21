import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Loader2,
  CheckCheck,
  ChevronUp,
  Smile,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Paperclip,
  Play,
  Pause,
  MapPin,
  Check,
} from 'lucide-react';
import type { Group, GroupMessage, RealtimeConnectionStatus } from '../../types/groupChat';
import type { Profile } from '../../types/profile';
import {
  fetchGroupMessages,
  sendGroupMessage,
  deleteGroupMessage,
  toggleMessageReaction,
  broadcastTyping,
  subscribeToGroupRoom,
  markGroupAsRead,
  fetchGroupMembers,
} from '../../lib/groupChatService';
import { GroupReactionPicker } from './GroupReactionPicker';
import { SuggestLocationModal } from './SuggestLocationModal';
import { LocationSuggestionCard } from './LocationSuggestionCard';
import { MessageContextMenu } from './MessageContextMenu';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import {
  isLocationSuggestionMessage,
  parseLocationSuggestion,
  suggestLocation,
} from '../../lib/locationSuggestionService';

interface GroupChatRoomProps {
  group: Group;
  currentUser: Profile;
  onToggleInfo: () => void;
  showInfoPanel: boolean;
  onViewOnGlobe?: (lat: number, lng: number, locationId: string) => void;
  onOpenAiHelp?: (text: string, mode: 'translate' | 'summarise' | 'rewrite' | 'replies') => void;
  onToggleAiHelp?: () => void;
}

export const GroupChatRoom: React.FC<GroupChatRoomProps> = ({
  group,
  currentUser,
  onToggleInfo,
  showInfoPanel,
  onViewOnGlobe,
  onOpenAiHelp,
  onToggleAiHelp,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('connecting');
  const [onlineCount, setOnlineCount] = useState(2);
  const [activePickerMessageId, setActivePickerMessageId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showSuggestLocation, setShowSuggestLocation] = useState(false);
  const [suggestingLocation, setSuggestingLocation] = useState(false);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
    messageText: string;
    isSelf: boolean;
  } | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    messageId: string;
    messageText: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State (e.g. "Message copied!")
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Long-press timer for mobile context menu
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (
    e: React.TouchEvent,
    messageId: string,
    messageText: string,
    isSelf: boolean
  ) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({
        x: clientX,
        y: clientY,
        messageId,
        messageText,
        isSelf,
      });
    }, 500);
  };

  const handleTouchEndOrMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    messageId: string,
    messageText: string,
    isSelf: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId,
      messageText,
      isSelf,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { success, error } = await deleteGroupMessage(
        deleteTarget.messageId,
        currentUser.id,
        group.id
      );

      if (error) {
        setToastMessage(error.message);
      } else if (success) {
        setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.messageId));
        setToastMessage('Message banished forever.');
      }
    } catch {
      setToastMessage('Failed to delete message.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Message copied!');
  };

  const handleAiTranslate = (text: string) => {
    if (onOpenAiHelp) {
      onOpenAiHelp(text, 'translate');
    }
  };

  const handleAiSummarise = (text: string) => {
    if (onOpenAiHelp) {
      onOpenAiHelp(text, 'summarise');
    }
  };

  // Toast timer auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Insert into chat listener from AI Help sidebar
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.text) {
        setInputText((prev) => (prev ? `${prev} ${custom.detail.text}` : custom.detail.text));
      }
    };
    window.addEventListener('hauntly_insert_chat_text', handleInsert);
    return () => window.removeEventListener('hauntly_insert_chat_text', handleInsert);
  }, []);

  // Typing tracking
  const [typingMap, setTypingMap] = useState<Map<string, { name: string; expires: number }>>(
    new Map()
  );
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCurrentlyTypingRef = useRef(false);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    const res = await fetchGroupMessages(group.id, currentUser.id, 30);
    if (res.data) {
      setMessages(res.data);
      setHasMore(res.hasMore);
    }
    setLoadingInitial(false);
    void markGroupAsRead(group.id, currentUser.id);
  }, [group.id, currentUser.id]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await fetchGroupMessages(group.id, currentUser.id, 30);
      if (!active) return;
      if (res.data) {
        setMessages(res.data);
        setHasMore(res.hasMore);
      }
      setLoadingInitial(false);
      void markGroupAsRead(group.id, currentUser.id);
    };
    void run();
    return () => {
      active = false;
    };
  }, [group.id, currentUser.id]);

  // Load earlier messages (Pagination)
  const handleLoadEarlier = async () => {
    if (loadingEarlier || !hasMore || messages.length === 0) return;
    setLoadingEarlier(true);

    const earliestTimestamp = messages[0].created_at;
    const oldScrollHeight = containerRef.current?.scrollHeight || 0;

    const res = await fetchGroupMessages(group.id, currentUser.id, 20, earliestTimestamp);
    if (res.data && res.data.length > 0) {
      setMessages((prev) => [...res.data, ...prev]);
      setHasMore(res.hasMore);

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop = newScrollHeight - oldScrollHeight;
        }
      });
    } else {
      setHasMore(false);
    }
    setLoadingEarlier(false);
  };

  // Real-time Room Subscription
  useEffect(() => {
    const unsub = subscribeToGroupRoom({
      groupId: group.id,
      currentUserId: currentUser.id,
      currentUserProfile: currentUser,
      onNewMessage: (newMsg) => {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        void markGroupAsRead(group.id, currentUser.id);
        if (shouldAutoScrollRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      },
      onMessageDeleted: (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
      onMessageReactionUpdated: async () => {
        // Refetch latest reaction state
        const refreshed = await fetchGroupMessages(group.id, currentUser.id, 50);
        if (refreshed.data) {
          setMessages(refreshed.data);
        }
      },
      onTypingUpdated: (userId, displayName, isTyping) => {
        setTypingMap((prev) => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(userId, { name: displayName, expires: Date.now() + 3000 });
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
      onPresenceUpdated: (count) => {
        setOnlineCount(count);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      unsub();
    };
  }, [group.id, currentUser]);

  // Clean up expired typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [uid, item] of next.entries()) {
          if (now > item.expires) {
            next.delete(uid);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if current user is admin of this group
  useEffect(() => {
    let active = true;
    void fetchGroupMembers(group.id).then((res) => {
      if (!active) return;
      const me = res.data.find((m) => m.user_id === currentUser.id);
      setIsCurrentUserAdmin(me?.role === 'admin');
    });
    return () => { active = false; };
  }, [group.id, currentUser.id]);

  // Handle location suggestion submission
  const handleSuggestLocation = async (place: {
    name: string;
    address: string;
    description: string;
    latitude: number;
    longitude: number;
    category: string;
  }) => {
    setSuggestingLocation(true);
    const { message, error } = await suggestLocation({
      groupId: group.id,
      userId: currentUser.id,
      name: place.name,
      address: place.address,
      description: place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      category: place.category,
    });

    if (!error) {
      if (message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      setShowSuggestLocation(false);
      // Scroll to bottom to see the new location card
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setSuggestingLocation(false);
  };

  const handleGlobeNavigation = (lat: number, lng: number, locId: string) => {
    if (onViewOnGlobe) {
      onViewOnGlobe(lat, lng, locId);
    } else {
      navigate(`/globe?groupId=${group.id}&locationId=${locId}`);
    }
  };

  // Handle typing broadcast debounced
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (!isCurrentlyTypingRef.current && text.length > 0) {
      isCurrentlyTypingRef.current = true;
      void broadcastTyping(group.id, currentUser.id, currentUser.display_name, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isCurrentlyTypingRef.current = false;
      void broadcastTyping(group.id, currentUser.id, currentUser.display_name, false);
    }, 2000);
  };

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loadingInitial) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [loadingInitial]);

  // Handle sending a message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    setInputText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isCurrentlyTypingRef.current = false;
    void broadcastTyping(group.id, currentUser.id, currentUser.display_name, false);

    // Optimistic message append
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: GroupMessage = {
      id: tempId,
      group_id: group.id,
      sender_id: currentUser.id,
      content: clean,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUser,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    const { data: sentMsg, error } = await sendGroupMessage(group.id, currentUser.id, clean);
    if (error) {
      console.warn('Failed to send group message', error);
      // Revert optimistic msg if error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (sentMsg) {
      // Replace temp message with server message
      setMessages((prev) => prev.map((m) => (m.id === tempId ? sentMsg : m)));
    }
  };

  // Toggle Reaction on message
  const handleReactionClick = async (messageId: string, emoji: string) => {
    // Optimistic reaction update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        let updatedReactions: typeof m.reactions;

        if (existing) {
          if (existing.userReacted) {
            // Remove user reaction
            if (existing.count === 1) {
              updatedReactions = m.reactions.filter((r) => r.emoji !== emoji);
            } else {
              updatedReactions = m.reactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      userReacted: false,
                      userIds: r.userIds.filter((u) => u !== currentUser.id),
                    }
                  : r
              );
            }
          } else {
            // Add user reaction to existing emoji
            updatedReactions = m.reactions.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count + 1,
                    userReacted: true,
                    userIds: [...r.userIds, currentUser.id],
                  }
                : r
            );
          }
        } else {
          // New emoji reaction
          updatedReactions = [
            ...m.reactions,
            { emoji, count: 1, userReacted: true, userIds: [currentUser.id] },
          ];
        }

        return { ...m, reactions: updatedReactions };
      })
    );

    await toggleMessageReaction(messageId, currentUser.id, emoji, group.id);
  };

  // Typing list names
  const activeTypers = Array.from(typingMap.values()).map((t) => t.name);

  // Group messages by date
  const formatDateHeader = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{
        background:
          'radial-gradient(circle at 60% 30%, #300c5c 0%, #1c0638 45%, #0e021e 85%, #080112 100%)',
      }}
    >
      {/* ── Chat Header ── */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b border-purple-900/40 flex-shrink-0"
        style={{ background: 'rgba(18,7,38,0.85)', backdropFilter: 'blur(10px)' }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onToggleInfo}
          title="View Coven Details"
        >
          <div className="relative">
            <img
              src={group.avatar_url || '/chat/avatar_designers_hero.png'}
              alt={group.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-500/50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/chat/avatar_designers_hero.png';
              }}
            />
            {connectionStatus === 'connected' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#120726]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{group.name}</h3>
            <div className="flex items-center gap-2 text-[11px] text-purple-300/70">
              <span>{group.member_count ?? 1} Spirits</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} Online
              </span>
            </div>
          </div>
        </div>

        {/* Realtime Status Indicator & Info Toggle */}
        <div className="flex items-center gap-3">
          {connectionStatus === 'connected' ? (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono font-medium shadow-[0_0_10px_rgba(52,211,153,0.2)]"
              title="Supabase Realtime Live"
            >
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Realtime Live</span>
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-mono font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>Connecting...</span>
            </div>
          ) : connectionStatus === 'offline' ? (
            <button
              type="button"
              onClick={loadInitialMessages}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-mono font-medium hover:bg-rose-900/60 transition-colors cursor-pointer"
              title="Click to reconnect"
            >
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>Offline (Reconnect)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={loadInitialMessages}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-mono font-medium hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Retry</span>
            </button>
          )}

          {/* Suggest Location Button in Chat Header */}
          <button
            type="button"
            onClick={() => setShowSuggestLocation(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-800/60 hover:bg-purple-700/80 border border-purple-500/50 text-purple-200 hover:text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            title="Suggest a Sanctuary for this Coven"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden md:inline">Suggest Location</span>
          </button>

          {/* AI Help Button in Chat Header */}
          <button
            type="button"
            onClick={onToggleAiHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 border border-purple-600/40 text-purple-200 hover:text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all cursor-pointer"
            title="Open Spectral AI Help"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4ff32]" />
            <span className="hidden sm:inline">AI Help</span>
          </button>

          <button
            type="button"
            onClick={onToggleInfo}
            className={`text-xs text-purple-300/80 hover:text-white px-3 py-1.5 rounded-xl border border-purple-800/40 transition-all flex items-center gap-1 cursor-pointer ${
              showInfoPanel ? 'bg-purple-800/50 text-white' : 'bg-purple-950/50'
            }`}
          >
            <span>Group Info</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showInfoPanel ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Offline Banner ── */}
      {connectionStatus === 'offline' && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-2 flex items-center justify-between text-xs text-rose-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Connection lost to ethereal plane. Messages will resynchronize upon reconnection.</span>
          </div>
          <button
            type="button"
            onClick={loadInitialMessages}
            className="flex items-center gap-1 text-[11px] underline font-semibold hover:text-white cursor-pointer ml-2"
          >
            <RefreshCw className="w-3 h-3" /> Reconnect
          </button>
        </div>
      )}

      {/* ── Messages Stream ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-900/30"
      >
        {/* Pagination Trigger */}
        {hasMore && (
          <div className="flex justify-center my-2">
            <button
              type="button"
              onClick={handleLoadEarlier}
              disabled={loadingEarlier}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/70 border border-purple-700/40 text-purple-200 text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingEarlier ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Summoning earlier transmissions...</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Load Earlier Transmissions</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading Initial Spinner */}
        {loadingInitial ? (
          <div className="flex flex-col items-center justify-center h-48 text-purple-300">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
            <p className="text-xs font-mono text-purple-400/60">Reading the astral scrolls...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center text-purple-300/70">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400/70 mb-3 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h4 className="text-base font-serif font-bold text-white mb-1">
              Silence in {group.name}
            </h4>
            <p className="text-xs text-purple-300/60 max-w-xs leading-relaxed">
              No spirits have whispered in this circle yet. Be the first to awaken the chat!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = Boolean(
              currentUser?.id && msg.sender_id && msg.sender_id === currentUser.id
            );
            const prevMsg = messages[index - 1];
            const showDateHeader =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !==
                new Date(msg.created_at).toDateString();

            const senderName = msg.sender?.display_name || 'Spirit';
            const senderAvatar = msg.sender?.avatar_url || '/hauntly-icon.png';
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <React.Fragment key={msg.id}>
                {/* Date Divider */}
                {showDateHeader && (
                  <div className="flex items-center justify-center my-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent flex-1" />
                    <span className="px-3 text-[11px] font-semibold text-purple-300/70 tracking-wider">
                      {formatDateHeader(msg.created_at)}
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent flex-1" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} group/msg relative mb-2`}
                >
                  {/* Sender Header */}
                  <div
                    className={`flex items-center gap-1.5 ${
                      isSelf ? 'justify-end pr-1' : 'justify-start pl-10'
                    } mb-1`}
                  >
                    {isSelf ? (
                      <>
                        <span className="text-[11px] text-purple-300/60 font-mono mr-1">{timeStr}</span>
                        <span className="text-xs font-semibold text-white">You</span>
                        <img
                          src={senderAvatar}
                          alt="You"
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-500/40 ml-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/chat/avatar_you_pumpkin.png';
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-white">{senderName}</span>
                        <span className="text-[11px] text-purple-300/60 font-mono ml-1">{timeStr}</span>
                      </>
                    )}
                  </div>

                  {/* Bubble Content Row with Hover Reaction Trigger */}
                  <div
                    className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%] ${
                      isSelf ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {!isSelf && (
                      <img
                        src={senderAvatar}
                        alt={senderName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/40 shrink-0 mt-0.5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/hauntly-icon.png';
                        }}
                      />
                    )}

                    {(() => {
                      const isLocSuggestion =
                        isLocationSuggestionMessage(msg.content) ||
                        msg.message_type === 'location_suggestion';
                      const locData = isLocSuggestion
                        ? parseLocationSuggestion(msg.content) || msg.location_data
                        : null;

                      if (isLocSuggestion && locData) {
                        return (
                          <div
                            onContextMenu={(e) => handleContextMenu(e, msg.id, msg.content, isSelf)}
                            onTouchStart={(e) => handleTouchStart(e, msg.id, msg.content, isSelf)}
                            onTouchEnd={handleTouchEndOrMove}
                            onTouchMove={handleTouchEndOrMove}
                            className="flex flex-col cursor-context-menu"
                            title="Right-click for options"
                          >
                            <LocationSuggestionCard
                              locationId={locData.location_id}
                              name={locData.name}
                              address={locData.address}
                              description={locData.description}
                              latitude={locData.latitude}
                              longitude={locData.longitude}
                              category={locData.category}
                              groupId={group.id}
                              currentUserId={currentUser.id}
                              isAdmin={isCurrentUserAdmin}
                              onViewOnGlobe={handleGlobeNavigation}
                            />
                            {isSelf && (
                              <div className="flex justify-end mt-1 pr-1">
                                <CheckCheck className="w-3.5 h-3.5 text-purple-300/80" />
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          onContextMenu={(e) => handleContextMenu(e, msg.id, msg.content, isSelf)}
                          onTouchStart={(e) => handleTouchStart(e, msg.id, msg.content, isSelf)}
                          onTouchEnd={handleTouchEndOrMove}
                          onTouchMove={handleTouchEndOrMove}
                          className={`relative px-4 py-2.5 text-xs font-medium leading-relaxed text-white shadow-lg cursor-context-menu transition-all ${
                            isSelf
                              ? 'rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-700 to-purple-900 shadow-[0_4px_20px_rgba(109,40,217,0.3)]'
                              : 'rounded-2xl rounded-tl-sm bg-gradient-to-r from-[#3e1373] to-[#2b0c54] border border-purple-700/30 shadow-[0_4px_20px_rgba(59,18,109,0.3)]'
                          }`}
                          title="Right-click for options"
                        >
                          {msg.message_type === 'audio' ? (
                            /* Audio Voice Note Bubble */
                            <div className="flex items-center gap-3 py-1 px-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                                }
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shrink-0"
                                title="Play audio message"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                              </button>

                              {/* Audio Waveform Bars */}
                              <div className="flex items-center gap-0.5 h-6 w-32 sm:w-40">
                                {[40, 65, 30, 85, 55, 95, 70, 45, 80, 60, 90, 50, 75, 35, 60, 90, 40, 70, 85, 30, 60, 45].map(
                                  (height, i) => (
                                    <span
                                      key={i}
                                      className={`w-1 rounded-full transition-all duration-200 ${
                                        playingAudioId === msg.id
                                          ? 'bg-purple-300 animate-pulse'
                                          : 'bg-purple-300/60'
                                      }`}
                                      style={{
                                        height: `${height}%`,
                                        animationDelay: `${(i % 5) * 150}ms`,
                                      }}
                                    />
                                  )
                                )}
                              </div>

                              <span className="text-[11px] font-mono text-purple-200/80">
                                {msg.audio_duration || '0:24'}
                              </span>
                            </div>
                          ) : msg.message_type === 'file' ? (
                            /* Document Attachment Bubble */
                            <div className="flex items-center gap-2.5 py-1 px-1">
                              <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-600/40 flex items-center justify-center text-purple-300 shrink-0">
                                <Paperclip className="w-4 h-4 text-purple-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-xs">{msg.file_name || msg.content}</p>
                                <p className="text-[10px] text-purple-300/70 font-mono">{msg.file_size || '2.4 MB'}</p>
                              </div>
                            </div>
                          ) : (
                            /* Text Message */
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}

                          {/* Outgoing Delivered Indicator */}
                          {isSelf && (
                            <div className="flex justify-end mt-1 -mr-1">
                              <CheckCheck className="w-3.5 h-3.5 text-purple-300/80" />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick Reaction Button on Hover */}
                    <div className="relative self-center">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePickerMessageId(
                            activePickerMessageId === msg.id ? null : msg.id
                          )
                        }
                        className="opacity-0 group-hover/msg:opacity-100 p-1 rounded-full bg-purple-950/70 hover:bg-purple-800/80 border border-purple-700/40 text-purple-300 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Add reaction"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Popover Reaction Picker */}
                      {activePickerMessageId === msg.id && (
                        <div
                          className={`absolute bottom-full mb-1 ${
                            isSelf ? 'right-0' : 'left-0'
                          }`}
                        >
                          <GroupReactionPicker
                            onSelectEmoji={(emoji) => handleReactionClick(msg.id, emoji)}
                            onClose={() => setActivePickerMessageId(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reaction Pills Row */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1.5 ${
                        isSelf ? 'justify-end pr-1' : 'justify-start pl-1'
                      }`}
                    >
                      {msg.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => handleReactionClick(msg.id, r.emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                            r.userReacted
                              ? 'bg-purple-800/80 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] scale-105'
                              : 'bg-purple-950/60 border-purple-800/50 text-purple-200 hover:bg-purple-900/60'
                          }`}
                          title={`Reacted by ${r.count} spirit${r.count > 1 ? 's' : ''}`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-mono text-[10px]">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Typing Indicator ── */}
      {(activeTypers.length > 0 || group.id === 'grp_designers') && (
        <div className="px-6 py-1 text-[11px] text-purple-300/80 italic flex items-center gap-2 animate-fadeIn">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span>
            {activeTypers.length > 0
              ? activeTypers.length === 1
                ? `${activeTypers[0]} is typing...`
                : `${activeTypers.join(', ')} are typing...`
              : 'Anastasia is typing...'}
          </span>
        </div>
      )}

      {/* ── WhatsApp-Style Input Bar ── */}
      <div className="p-4 pt-1 flex-shrink-0">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-purple-700/40"
          style={{
            background: 'rgba(14,5,30,0.95)',
            boxShadow: '0 0 25px rgba(124,58,237,0.25)',
          }}
        >
          <button
            type="button"
            className="text-purple-400 hover:text-white transition-colors cursor-pointer"
            title="Attach file"
            onClick={() => {
              setInputText((prev) => (prev ? prev : 'Sharing artifact...'));
            }}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="text-purple-400 hover:text-white transition-colors cursor-pointer"
            title="Suggest a place"
            onClick={() => setShowSuggestLocation(true)}
          >
            <MapPin className="w-4 h-4 text-purple-300" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Your Message..."
            className="flex-1 bg-transparent text-xs text-white placeholder-purple-400/40 outline-none font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:hover:bg-purple-700 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ── Suggest Location Modal ── */}
      {showSuggestLocation && (
        <SuggestLocationModal
          isOpen={showSuggestLocation}
          onClose={() => setShowSuggestLocation(false)}
          onSuggest={handleSuggestLocation}
          submitting={suggestingLocation}
        />
      )}

      {/* ── Right-Click Message Context Menu ── */}
      {contextMenu && (
        <MessageContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          messageId={contextMenu.messageId}
          messageText={contextMenu.messageText}
          isSelf={contextMenu.isSelf}
          onClose={() => setContextMenu(null)}
          onDeleteRequest={(id, text) => {
            setDeleteTarget({ messageId: id, messageText: text });
          }}
          onCopyRequest={handleCopyMessage}
          onAiTranslateRequest={handleAiTranslate}
          onAiSummariseRequest={handleAiSummarise}
          onAiRewriteRequest={(text) => onOpenAiHelp?.(text, 'rewrite')}
          onAiRepliesRequest={(text) => onOpenAiHelp?.(text, 'replies')}
        />
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <DeleteConfirmationModal
          isOpen={Boolean(deleteTarget)}
          messageText={deleteTarget.messageText}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Toast Notification (e.g. "Message copied!") ── */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2.5 rounded-2xl bg-[#1b122e] border border-purple-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(168,85,247,0.35)] text-white text-xs font-semibold flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
