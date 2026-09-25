import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import { useSocket } from '../src/context/SocketContext';
import UserAvatar from './UserAvatar';
import Message from './Message';
import {
  IoSend,
  IoArrowBack,
  IoLockClosedOutline,
  IoHappyOutline,
  IoChatbubbleEllipsesOutline,
  IoSearchOutline,
  IoChevronUp,
  IoChevronDown,
  IoCloseOutline,
  IoPencilOutline,
  IoArrowUndoOutline,
} from 'react-icons/io5';

const quickEmojis = ['👍', '❤️', '🔥', '😂', '🎉', '😊', '🙌', '✨', '👏', '👀', '💯', '🚀'];

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDateDivider = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  if (isSameDay(date, today)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const MessageContainer = () => {
  const { authUser } = useAuth();
  const { onlineUsers } = useSocket();
  const {
    selectedUser,
    messages,
    loadingMessages,
    isSending,
    sendMessage,
    closeMobileChat,
    typingUsers,
    sendTyping,
    sendStopTyping,
    replyingTo,
    cancelReply,
    editingMessage,
    cancelEdit,
    editMessage,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const messagesContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isRecipientTyping = Boolean(selectedUser?._id && typingUsers?.[String(selectedUser._id)]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Matching messages for in-chat search
  const searchMatches = chatSearchQuery.trim()
    ? messages.filter(
        (m) =>
          !m.isDeleted &&
          (m.content || m.message || '')
            .toLowerCase()
            .includes(chatSearchQuery.toLowerCase().trim())
      )
    : [];

  // When editingMessage changes, update inputText
  useEffect(() => {
    if (editingMessage) {
      setInputText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // Focus search input when toggled
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setChatSearchQuery('');
      setCurrentMatchIndex(0);
    }
  }, [showSearch]);

  const scrollToMatch = (index) => {
    if (searchMatches.length === 0 || index < 0 || index >= searchMatches.length) return;
    const matchMsg = searchMatches[index];
    const el = document.getElementById(`message-${matchMsg._id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400'), 1800);
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Instant scroll on conversation switch
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedUser?._id]);

  // Smooth scroll when new messages arrive or when recipient is typing
  useEffect(() => {
    if (!showSearch) {
      scrollToBottom('smooth');
    }
  }, [messages, loadingMessages, isRecipientTyping, showSearch]);

  // Clean up typing state on switch/unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (selectedUser?._id) {
        sendStopTyping(selectedUser._id);
      }
    };
  }, [selectedUser?._id, sendStopTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (!selectedUser?._id) return;

    if (val.trim()) {
      sendTyping(selectedUser._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(selectedUser._id);
      }, 1800);
    } else {
      sendStopTyping(selectedUser._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (selectedUser?._id) {
      sendStopTyping(selectedUser._id);
    }

    const text = inputText;
    setInputText('');
    setShowEmojiPicker(false);

    if (editingMessage) {
      await editMessage(editingMessage._id, text);
      cancelEdit();
    } else {
      await sendMessage(text, replyingTo);
      cancelReply();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickSend = (text) => {
    setInputText(text);
    textareaRef.current?.focus();
  };

  const isRecipientOnline = onlineUsers.includes(String(selectedUser?._id));

  // EMPTY STATE when no user is selected
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center select-none bg-[#090d16]">
        <div className="max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-4 shadow-sm">
            <IoChatbubbleEllipsesOutline className="w-8 h-8 text-indigo-400" />
          </div>

          <h2 className="text-lg font-semibold text-white mb-1.5">
            Your messages
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Select a contact from the sidebar to start a conversation.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
            <IoLockClosedOutline className="w-3.5 h-3.5 text-indigo-400" />
            <span>End-to-end encrypted chat</span>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE CONVERSATION
  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#080c15] relative overflow-hidden">
      {/* 1. Chat Top Header */}
      <div className="flex-shrink-0 px-4 py-3 sm:px-5 sm:py-3 border-b border-white/[0.08] bg-[#0c101b] flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={closeMobileChat}
            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
            title="Back to contacts"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>

          {/* Recipient Avatar */}
          <UserAvatar user={selectedUser} size="md" isOnline={isRecipientOnline} />

          {/* Recipient Details */}
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">
              {selectedUser.fullName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isRecipientTyping ? (
                <div className="flex items-center gap-1 text-indigo-400 font-medium">
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>typing...</span>
                </div>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRecipientOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  <span className={isRecipientOnline ? 'text-emerald-400' : 'text-slate-500'}>
                    {isRecipientOnline ? 'Online' : 'Offline'}
                  </span>
                  <span>•</span>
                  <span className="truncate">@{selectedUser.userName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Header Icons */}
        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            title="Search in conversation"
            className={`p-2 rounded-lg transition cursor-pointer ${
              showSearch
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <IoSearchOutline className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar Overlay */}
      {showSearch && (
        <div className="flex-shrink-0 px-4 py-2 bg-[#0e1422] border-b border-white/[0.08] flex items-center justify-between gap-2 z-10 animate-in slide-in-from-top-2 duration-100">
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-white/[0.04] border border-white/[0.08] focus-within:border-indigo-500 rounded-lg px-3 py-1.5 transition">
            <IoSearchOutline className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={chatSearchQuery}
              onChange={(e) => {
                setChatSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                } else if (e.key === 'Escape') {
                  setShowSearch(false);
                }
              }}
              placeholder="Search in conversation..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 text-xs text-slate-400">
            {chatSearchQuery.trim() && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 font-medium">
                {searchMatches.length > 0
                  ? `${currentMatchIndex + 1} of ${searchMatches.length}`
                  : '0 results'}
              </span>
            )}

            <button
              onClick={handlePrevMatch}
              disabled={searchMatches.length === 0}
              title="Previous match (Shift+Enter)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <IoChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchMatches.length === 0}
              title="Next match (Enter)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <IoChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSearch(false)}
              title="Close search (Esc)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-1"
      >
        {/* Subtle Security Badge */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
            <IoLockClosedOutline className="w-3.5 h-3.5 text-indigo-400" />
            <span>End-to-end encrypted chat</span>
          </div>
        </div>

        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Conversation State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-indigo-400 mb-3">
              <IoChatbubbleEllipsesOutline className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">
              No messages yet
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Say hello to {selectedUser.fullName} to start chatting!
            </p>

            {/* Quick Greeting Chips */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
              <button
                onClick={() => handleQuickSend('Hey there! 👋')}
                className="px-3 py-1 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition cursor-pointer"
              >
                Hey there! 👋
              </button>
              <button
                onClick={() => handleQuickSend("How's it going? 😊")}
                className="px-3 py-1 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition cursor-pointer"
              >
                How's it going? 😊
              </button>
            </div>
          </div>
        ) : (
          /* Messages list with Day Dividers */
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDateDivider = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

            return (
              <React.Fragment key={msg._id || index}>
                {showDateDivider && (
                  <div className="flex justify-center my-3 select-none">
                    <span className="text-[11px] font-medium text-slate-400 bg-white/[0.04] px-3 py-0.5 rounded-full border border-white/[0.06]">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <Message message={msg} />
              </React.Fragment>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {isRecipientTyping && (
          <div className="flex items-end gap-2 my-2 animate-in fade-in duration-150">
            <UserAvatar
              user={selectedUser}
              size="xs"
              showStatus={false}
              className="mb-1 hidden sm:block"
            />
            <div className="px-3.5 py-2 rounded-2xl rounded-bl-xs bg-[#181f2e] border border-white/[0.07] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-indigo-300 font-medium ml-1">typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Message Box Dock */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-[#0a0e18] border-t border-white/[0.08] relative">
        {/* Floating Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-4 sm:left-6 mb-2 z-30 p-2 rounded-xl bg-[#0f1422] border border-white/[0.1] shadow-xl flex flex-wrap gap-1 max-w-[280px] animate-in fade-in duration-100"
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.08] hover:scale-115 flex items-center justify-center text-lg transition cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Active Quoted Reply Banner */}
        {replyingTo && (
          <div className="mb-2 px-3 py-1.5 rounded-r-xl bg-white/[0.03] border-l-2 border-indigo-500 border-y border-r border-white/[0.06] flex items-center justify-between gap-2 animate-in slide-in-from-bottom-1 duration-100">
            <div className="flex items-center gap-2 min-w-0">
              <IoArrowUndoOutline className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="font-medium text-indigo-300 block truncate">
                  Replying to {replyingTo.senderName}
                </span>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition cursor-pointer flex-shrink-0"
              title="Cancel reply"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Edit Message Banner */}
        {editingMessage && (
          <div className="mb-2 px-3 py-1.5 rounded-r-xl bg-white/[0.03] border-l-2 border-sky-500 border-y border-r border-white/[0.06] flex items-center justify-between gap-2 animate-in slide-in-from-bottom-1 duration-100">
            <div className="flex items-center gap-2 min-w-0">
              <IoPencilOutline className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="font-medium text-sky-300 block truncate">
                  Editing message
                </span>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {editingMessage.content}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                cancelEdit();
                setInputText('');
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition cursor-pointer flex-shrink-0"
              title="Cancel edit"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-2xl p-1.5 transition"
        >
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-xl transition cursor-pointer mb-0.5 ${
              showEmojiPicker
                ? 'text-indigo-400 bg-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
            title="Emoji"
          >
            <IoHappyOutline className="w-5 h-5" />
          </button>

          {/* Multiline / Single-line Auto-Expanding Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? 'Edit message...'
                : replyingTo
                ? `Reply to ${replyingTo.senderName}...`
                : `Message ${selectedUser.fullName}...`
            }
            className="flex-1 bg-transparent px-1 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed max-h-[120px] overflow-y-auto"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`p-2.5 rounded-xl transition flex items-center justify-center flex-shrink-0 cursor-pointer mb-0.5 ${
              inputText.trim() && !isSending
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-95'
                : 'text-slate-500 opacity-40 cursor-not-allowed'
            }`}
            title="Send (Enter)"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <IoSend className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageContainer;