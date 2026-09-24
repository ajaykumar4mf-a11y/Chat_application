import React, { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import { useSocket } from '../src/context/SocketContext';
import UserAvatar from './UserAvatar';
import {
  IoSearchOutline,
  IoCloseCircle,
  IoChatbubbleEllipsesOutline,
  IoLogOutOutline,
  IoRefreshOutline,
  IoPersonOutline,
  IoSparkles,
} from 'react-icons/io5';

const Sidebar = () => {
  const { authUser, logout, loading: authLoading } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const {
    filteredUsers,
    loadingUsers,
    selectedUser,
    selectUser,
    searchQuery,
    setSearchQuery,
    fetchUsers,
    unreadCounts,
  } = useChat();

  const [activeTab, setActiveTab] = useState('all');

  const totalUnread = Object.values(unreadCounts || {}).reduce((acc, count) => acc + count, 0);

  const displayedUsers = filteredUsers.filter((u) => {
    if (activeTab === 'unread') {
      return (unreadCounts?.[u._id] || 0) > 0;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#090d16]/95 backdrop-blur-xl select-none">
      {/* 1. Top Header & Branding (Fixed height, cannot shrink) */}
      <div className="flex-shrink-0 p-3.5 sm:p-4 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-70 blur-sm group-hover:opacity-100 transition duration-300" />
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <IoChatbubbleEllipsesOutline className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                PulseChat
                <IoSparkles className="w-3.5 h-3.5 text-indigo-400" />
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`w-2 h-2 rounded-full ${socket ? 'bg-emerald-500' : 'bg-amber-500'} relative flex`}>
                {socket && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
              </span>
              <span>{socket ? `${onlineUsers.length} Online` : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          title="Refresh Contacts"
          disabled={loadingUsers}
          className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
        >
          <IoRefreshOutline
            className={`w-4 h-4 ${loadingUsers ? 'animate-spin text-indigo-400' : ''}`}
          />
        </button>
      </div>

      {/* 2. Search Bar (Fixed height, cannot shrink) */}
      <div className="flex-shrink-0 p-3 pb-2">
        <div className="relative flex items-center">
          <IoSearchOutline className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts or @username..."
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.07] rounded-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <IoCloseCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Filter Tabs (Fixed height, cannot shrink) */}
      <div className="flex-shrink-0 px-3 py-1.5 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <span>All Users</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-300">
              {filteredUsers.length}
            </span>
          </button>

          {totalUnread > 0 && (
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <span>Unread</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white animate-pulse">
                {totalUnread}
              </span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {displayedUsers.length} contact{displayedUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 4. User / Conversation List (Strict min-h-0 + overflow-y-auto to trigger proper scrolling) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-2 space-y-1.5">
        {loadingUsers ? (
          /* Loading Skeletons */
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.08]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-white/[0.08] rounded w-2/3" />
                <div className="h-2.5 bg-white/[0.05] rounded w-1/3" />
              </div>
            </div>
          ))
        ) : displayedUsers.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-2.5 text-slate-400">
              <IoPersonOutline className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              {activeTab === 'unread'
                ? 'No unread messages'
                : searchQuery
                ? 'No contacts found'
                : 'No contacts available'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {activeTab === 'unread'
                ? 'You are all caught up!'
                : searchQuery
                ? `No user matching "${searchQuery}"`
                : 'Registered accounts will appear here automatically.'}
            </p>
            {(searchQuery || activeTab === 'unread') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Show all contacts
              </button>
            )}
          </div>
        ) : (
          /* User Items */
          displayedUsers.map((user) => {
            const isSelected = selectedUser?._id === user._id;
            const isOnline = onlineUsers.includes(String(user._id));
            const unreadCount = unreadCounts?.[user._id] || 0;

            return (
              <button
                key={user._id}
                onClick={() => selectUser(user)}
                className={`w-full text-left p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-transparent border-indigo-500/60 shadow-lg shadow-indigo-600/10 text-white'
                    : 'bg-transparent hover:bg-white/[0.04] border-transparent hover:border-white/[0.06] text-slate-300'
                }`}
              >
                {/* Modern Avatar with reliable gradient fallback */}
                <UserAvatar user={user} size="md" isOnline={isOnline} />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {user.fullName}
                    </h3>
                    <span
                      className={`text-[10px] font-medium ${
                        isOnline ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">@{user.userName}</span>
                      {user.gender && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 capitalize">
                          {user.gender}
                        </span>
                      )}
                    </div>

                    {/* Unread Message Count Badge: 1, 2, ... */}
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 animate-in zoom-in-75 duration-150">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 5. Bottom Current User Profile & Logout Bar (Fixed height, cannot shrink) */}
      <div className="flex-shrink-0 p-3 sm:p-3.5 bg-white/[0.02] border-t border-white/[0.07] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar user={authUser} size="md" isOnline={true} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {authUser?.fullName || 'My Account'}
            </p>
            <p className="text-xs text-slate-400 truncate leading-tight">
              @{authUser?.userName || 'user'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          disabled={authLoading}
          title="Sign out"
          className="flex-shrink-0 p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <IoLogOutOutline className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;