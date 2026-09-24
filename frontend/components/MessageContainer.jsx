import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import { useSocket } from '../src/context/SocketContext';
import UserAvatar from './UserAvatar';
import Message from './Message';
import {
  IoSend,
  IoArrowBack,
  IoCallOutline,
  IoVideocamOutline,
  IoEllipsisVertical,
  IoLockClosedOutline,
  IoHappyOutline,
  IoAttachOutline,
  IoChatbubbleEllipsesOutline,
  IoSparklesOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';

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
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesContainerRef = useRef(null);

  // Scroll ONLY the messages container itself to avoid scrolling the window
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
    // Instant scroll on initial load of conversation
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedUser?._id]);

  // Smooth scroll when new messages arrive
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loadingMessages]);

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText('');
    setShowEmojiPicker(false);
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickSend = (text) => {
    setInputText(text);
  };

  const isRecipientOnline = onlineUsers.includes(String(selectedUser?._id));
  const quickEmojis = ['👋', '❤️', '🔥', '👍', '😂', '🎉', '🚀', '✨'];

  // EMPTY STATE when no user is selected
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center select-none bg-[#090d16]/60">
        <div className="max-w-md flex flex-col items-center">
          {/* Animated Glowing Chat Orb */}
          <div className="relative group mb-6">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-xl group-hover:opacity-90 transition duration-500 animate-pulse" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-500/50 border border-white/20">
              <IoChatbubbleEllipsesOutline className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            Welcome, {authUser?.fullName || 'User'}! 👋
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mb-6 sm:mb-8 leading-relaxed">
            Select a contact from the sidebar to begin instant, protected, and real-time messaging with your peers.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center hover:border-indigo-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1.5">
                <IoSparklesOutline className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Real-Time</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Instant delivery</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5">
                <IoShieldCheckmarkOutline className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Private</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Protected chats</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center hover:border-cyan-500/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5">
                <IoLockClosedOutline className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Encrypted</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Session security</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/[0.05]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Select any conversation on the left to start chatting</span>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE CHAT STATE
  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-[#080c15]/95 backdrop-blur-xl relative overflow-hidden">
      {/* 1. Chat Top Header (Fixed height, flex-shrink-0) */}
      <div className="flex-shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={closeMobileChat}
            className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-all cursor-pointer"
            title="Back to contacts"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>

          {/* Recipient Avatar with Online Badge */}
          <UserAvatar user={selectedUser} size="lg" isOnline={isRecipientOnline} />

          {/* Recipient Details */}
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">
              {selectedUser.fullName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRecipientOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span
                className={`font-medium ${
                  isRecipientOnline ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {isRecipientOnline ? 'Online now' : 'Offline'}
              </span>
              <span>•</span>
              <span className="truncate">@{selectedUser.userName}</span>
            </div>
          </div>
        </div>

        {/* Action Header Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            title="Audio call"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <IoCallOutline className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            title="Video call"
            className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <IoVideocamOutline className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            title="More options"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <IoEllipsisVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Area (Direct container scrolling, flex-1 min-h-0) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4"
      >
        {/* Security Notification Banner */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
            <IoLockClosedOutline className="w-3.5 h-3.5 text-indigo-400" />
            <span>Messages are encrypted with JWT-protected session.</span>
          </div>
        </div>

        {loadingMessages ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading conversation history...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Conversation State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
              <IoChatbubbleEllipsesOutline className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-200">
              No messages yet
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Say hello to {selectedUser.fullName} and get the conversation rolling!
            </p>

            {/* Quick Greeting Chips */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
              <button
                onClick={() => handleQuickSend('Hey there! 👋')}
                className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-indigo-600/20 border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Hey there! 👋
              </button>
              <button
                onClick={() => handleQuickSend("How's it going? 😊")}
                className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-indigo-600/20 border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                How's it going? 😊
              </button>
              <button
                onClick={() => handleQuickSend('Ready to chat! 🚀')}
                className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] hover:bg-indigo-600/20 border border-white/[0.08] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Ready to chat! 🚀
              </button>
            </div>
          </div>
        ) : (
          /* Render Messages via Message component */
          messages.map((msg, index) => (
            <Message key={msg._id || index} message={msg} />
          ))
        )}
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 sm:left-6 z-20 p-2 rounded-2xl bg-[#0c101b]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="w-8 h-8 rounded-xl hover:bg-white/[0.1] flex items-center justify-center text-lg hover:scale-115 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 3. Bottom Message Input Dock (flex-shrink-0) */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-[#0a0e1a]/95 border-t border-white/[0.07] backdrop-blur-xl">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] focus-within:border-indigo-500/50 focus-within:bg-white/[0.06] rounded-2xl p-1.5 transition-all shadow-inner"
        >
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              showEmojiPicker
                ? 'text-indigo-400 bg-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
            }`}
            title="Add emoji"
          >
            <IoHappyOutline className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all hidden sm:flex cursor-pointer"
            title="Attach file"
          >
            <IoAttachOutline className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.fullName}...`}
            className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-purple-600 active:scale-95 flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Send Message (Enter)"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IoSend className="w-4 h-4 transform -rotate-12 translate-x-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageContainer;