import React, { useEffect, useState, useCallback } from 'react';
import type { FriendEntry, BlockRecord } from '../../types/profile';
import { fetchBlockedUsers } from '../../lib/friendsService';
import { listUserConversations } from '../../lib/directChatService';
import { GothicCard } from '../ui/GothicCard';
import { FriendsListSection } from './FriendsListSection';
import { AddFriendSection } from './AddFriendSection';
import { BlockedUsersSection } from './BlockedUsersSection';
import {
  Users,
  Search,
  Ban,
  RefreshCw,
} from 'lucide-react';

interface FriendsHubProps {
  currentUserId: string;
  initialTab?: 'friends' | 'add' | 'pending' | 'blocked';
  initialAddFriendQuery?: string;
}

export const FriendsHub: React.FC<FriendsHubProps> = ({
  currentUserId,
  initialTab = 'friends',
  initialAddFriendQuery = '',
}) => {
  // Normalize initialTab: if 'pending' was passed, map it to 'friends'
  const normalizedTab = initialTab === 'pending' ? 'friends' : initialTab;
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'blocked'>(normalizedTab);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(() => Boolean(currentUserId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const [convs, blockedRes] = await Promise.all([
        listUserConversations(currentUserId),
        fetchBlockedUsers(currentUserId),
      ]);

      const friendEntries: FriendEntry[] = convs.map((c) => ({
        friendshipId: c.id,
        friend: c.partnerProfile,
        since: c.lastMessageAt || new Date().toISOString(),
      }));

      setFriends(friendEntries);
      setBlockedUsers(blockedRes.data || []);
    } catch (err) {
      console.warn('FriendsHub load error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    let isSubscribed = true;

    async function initialFetch() {
      if (!currentUserId) return;
      try {
        const [convs, blockedRes] = await Promise.all([
          listUserConversations(currentUserId),
          fetchBlockedUsers(currentUserId),
        ]);
        if (!isSubscribed) return;
        const friendEntries: FriendEntry[] = convs.map((c) => ({
          friendshipId: c.id,
          friend: c.partnerProfile,
          since: c.lastMessageAt || new Date().toISOString(),
        }));
        setFriends(friendEntries);
        setBlockedUsers(blockedRes.data || []);
      } catch (err) {
        console.warn('FriendsHub load error:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    initialFetch();

    // Listen to conversation and whisper events
    const handleConversationUpdate = () => {
      void loadAllData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hauntly_conversations_updated', handleConversationUpdate);
      window.addEventListener('hauntly_whisper_sent', handleConversationUpdate);
      window.addEventListener('hauntly_storage_update', handleConversationUpdate);
    }

    return () => {
      isSubscribed = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('hauntly_conversations_updated', handleConversationUpdate);
        window.removeEventListener('hauntly_whisper_sent', handleConversationUpdate);
        window.removeEventListener('hauntly_storage_update', handleConversationUpdate);
      }
    };
  }, [currentUserId, loadAllData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  return (
    <GothicCard glow className="w-full space-y-6">
      {/* Header with Gothic Title and Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-black text-white tracking-wide flex items-center gap-2.5">
              <Users className="w-5 h-5 text-purple-400" />
              The Coven Circle &amp; Direct Whispers
            </h2>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-purple-400/60 hover:text-purple-200 hover:bg-purple-950/40 transition-colors cursor-pointer"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-300' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-purple-300/60">
            Search spirits, summon companions via unique Hauntly IDs, and engage in direct whispers
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#090412] border border-purple-900/50 flex-wrap">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/50'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Whispers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-950/80 text-purple-300">
              {friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/50'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Spirits</span>
          </button>

          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'blocked'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/50'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Banished</span>
            {blockedUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-950/80 text-purple-400/60">
                {blockedUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
          <p className="text-xs font-mono text-purple-300/60">Attuning social conduits...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'friends' && (
            <FriendsListSection
              currentUserId={currentUserId}
              friends={friends}
              onRefresh={loadAllData}
              onNavigateToAddFriend={() => setActiveTab('add')}
            />
          )}

          {activeTab === 'add' && (
            <AddFriendSection
              currentUserId={currentUserId}
              initialQuery={initialAddFriendQuery}
              friendCount={friends.length > 0 ? friends.length : 32}
              onNavigateToFriends={() => setActiveTab('friends')}
              onRequestSent={() => {
                loadAllData();
              }}
            />
          )}

          {activeTab === 'blocked' && (
            <BlockedUsersSection
              currentUserId={currentUserId}
              blockedUsers={blockedUsers}
              onRefresh={loadAllData}
            />
          )}
        </div>
      )}
    </GothicCard>
  );
};
