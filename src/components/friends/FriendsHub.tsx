import React, { useEffect, useState, useCallback } from 'react';
import type { FriendEntry, Friendship, BlockRecord } from '../../types/profile';
import {
  fetchAcceptedFriends,
  fetchPendingRequests,
  fetchBlockedUsers,
} from '../../lib/friendsService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GothicCard } from '../ui/GothicCard';
import { FriendsListSection } from './FriendsListSection';
import { AddFriendSection } from './AddFriendSection';
import { PendingRequestsSection } from './PendingRequestsSection';
import { BlockedUsersSection } from './BlockedUsersSection';
import {
  Users,
  UserPlus,
  Inbox,
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
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'pending' | 'blocked'>(initialTab);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(() => isSupabaseConfigured && Boolean(currentUserId));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!currentUserId || !isSupabaseConfigured) {
      return;
    }

    try {
      const [friendsRes, requestsRes, blockedRes] = await Promise.all([
        fetchAcceptedFriends(currentUserId),
        fetchPendingRequests(currentUserId),
        fetchBlockedUsers(currentUserId),
      ]);

      setFriends(friendsRes.data || []);
      setReceivedRequests(requestsRes.received || []);
      setSentRequests(requestsRes.sent || []);
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
      if (!currentUserId || !isSupabaseConfigured) return;
      try {
        const [friendsRes, requestsRes, blockedRes] = await Promise.all([
          fetchAcceptedFriends(currentUserId),
          fetchPendingRequests(currentUserId),
          fetchBlockedUsers(currentUserId),
        ]);
        if (!isSubscribed) return;
        setFriends(friendsRes.data || []);
        setReceivedRequests(requestsRes.received || []);
        setSentRequests(requestsRes.sent || []);
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

    if (!isSupabaseConfigured) return;

    // Realtime postgres changes listener on friendships table
    const channel = supabase
      .channel('hauntly-friendships-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadAllData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  const pendingReceivedCount = receivedRequests.length;

  return (
    <GothicCard glow className="w-full space-y-6">
      {/* Header with Gothic Title and Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-black text-white tracking-wide flex items-center gap-2.5">
              <Users className="w-5 h-5 text-purple-400" />
              The Coven Circle &amp; Social Realm
            </h2>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-purple-400/60 hover:text-purple-200 hover:bg-purple-950/40 transition-colors cursor-pointer"
              title="Refresh friendship ether"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-300' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-purple-300/60">
            Form spectral bonds, manage invocations, and summon companions via unique Hauntly IDs
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
            <span>Coven</span>
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
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/50'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingReceivedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse">
                {pendingReceivedCount}
              </span>
            )}
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
          <p className="text-xs font-mono text-purple-300/60">Summoning social conduits from Supabase...</p>
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

          {activeTab === 'pending' && (
            <PendingRequestsSection
              currentUserId={currentUserId}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onRefresh={loadAllData}
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
