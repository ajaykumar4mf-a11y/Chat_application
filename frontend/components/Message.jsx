import React, { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import UserAvatar from './UserAvatar';
import {
  IoCheckmarkDone,
  IoCopyOutline,
  IoCheckmark,
  IoArrowUndoOutline,
  IoHappyOutline,
  IoPencilOutline,
  IoTrashOutline,
} from 'react-icons/io5';

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const Message = ({ message }) => {
  const { authUser } = useAuth();
  const {
    selectedUser,
    setReplyingTo,
    setEditingMessage,
    reactToMessage,
    deleteMessage,
  } = useChat();

  const [copied, setCopied] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  if (!message) return null;

  const authUserId = authUser?._id || authUser?.id;
  const senderId = message.senderId?._id || message.senderId;
  const isMe = Boolean(authUserId && senderId && String(senderId) === String(authUserId));
  const textContent = message.content || message.message || '';
  const isDeleted = Boolean(message.isDeleted);
  const isEdited = Boolean(message.isEdited);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopy = () => {
    if (!textContent || isDeleted) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReaction = (emoji) => {
    reactToMessage(message._id, emoji);
    setShowReactionPicker(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message for everyone?')) {
      deleteMessage(message._id);
    }
  };

  const isSeen = Boolean(message.seen);
  const isDelivered = Boolean(message.delivered || isSeen);

  const renderDeliveryStatus = () => {
    if (isSeen) {
      return (
        <span className="flex items-center text-sky-300" title="Seen">
          <IoCheckmarkDone className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (isDelivered) {
      return (
        <span className="flex items-center text-white/70" title="Delivered">
          <IoCheckmarkDone className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span className="flex items-center text-white/70" title="Sent">
        <IoCheckmark className="w-3.5 h-3.5" />
      </span>
    );
  };

  // Aggregate reactions by emoji
  const reactionsMap = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, hasReacted: false };
    }
    acc[r.emoji].count += 1;
    if (String(r.user?._id || r.user) === String(authUserId)) {
      acc[r.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  const reactionsList = Object.entries(reactionsMap).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    hasReacted: data.hasReacted,
  }));

  return (
    <div
      id={`message-${message._id}`}
      className={`group relative flex items-end gap-2 w-full my-1 transition-all duration-150 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Recipient avatar on the left (only for incoming messages) */}
      {!isMe && (
        <UserAvatar
          user={selectedUser}
          size="xs"
          showStatus={false}
          className="mb-1 flex-shrink-0 hidden sm:block"
        />
      )}

      {/* Bubble + Reactions Wrapper */}
      <div
        className={`relative flex flex-col max-w-[85%] sm:max-w-[68%] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Floating Quick Action Toolbar on Hover */}
        {!isDeleted && (
          <div
            className={`absolute -top-7 z-10 hidden group-hover:flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-[#0e1422]/95 backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in duration-100 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {/* Quick Reaction Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker((prev) => !prev)}
                title="React"
                className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] transition cursor-pointer text-xs"
              >
                <IoHappyOutline className="w-3.5 h-3.5" />
              </button>

              {/* Reaction Popup */}
              {showReactionPicker && (
                <div className="absolute bottom-8 left-0 z-30 flex items-center gap-1 p-1 rounded-xl bg-[#0e1422] border border-white/15 shadow-xl animate-in fade-in duration-100">
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-7 h-7 rounded-lg hover:bg-white/[0.1] hover:scale-115 flex items-center justify-center text-sm transition cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={() =>
                setReplyingTo({
                  _id: message._id,
                  content: textContent,
                  senderName: isMe ? 'You' : selectedUser?.fullName || 'Contact',
                  senderId: message.senderId,
                })
              }
              title="Reply"
              className="p-1 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition cursor-pointer text-xs"
            >
              <IoArrowUndoOutline className="w-3.5 h-3.5" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy text"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer text-xs"
            >
              {copied ? (
                <IoCheckmark className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <IoCopyOutline className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Edit Button (Sender only) */}
            {isMe && (
              <button
                onClick={() =>
                  setEditingMessage({
                    _id: message._id,
                    content: textContent,
                  })
                }
                title="Edit message"
                className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-white/[0.08] transition cursor-pointer text-xs"
              >
                <IoPencilOutline className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Button (Sender only) */}
            {isMe && (
              <button
                onClick={handleDelete}
                title="Delete message"
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition cursor-pointer text-xs"
              >
                <IoTrashOutline className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-xs transition-colors select-text ${
            isDeleted
              ? 'bg-white/[0.03] border border-white/[0.06] text-slate-400 italic rounded-2xl'
              : isMe
              ? 'bg-indigo-600 text-white rounded-br-xs'
              : 'bg-[#181f2e] text-slate-100 border border-white/[0.07] rounded-bl-xs'
          }`}
        >
          {/* Quoted Reply Card (if message is replying to another) */}
          {message.replyTo?.content && !isDeleted && (
            <div
              onClick={() => {
                const target = document.getElementById(`message-${message.replyTo._id}`);
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  target.classList.add('ring-2', 'ring-indigo-400');
                  setTimeout(() => target.classList.remove('ring-2', 'ring-indigo-400'), 1500);
                }
              }}
              className={`mb-1.5 p-2 rounded-lg text-xs cursor-pointer transition text-left border-l-2 ${
                isMe
                  ? 'bg-black/20 border-white/70 hover:bg-black/30'
                  : 'bg-white/[0.04] border-indigo-400 hover:bg-white/[0.08]'
              }`}
            >
              <p className={`font-medium text-[11px] truncate ${isMe ? 'text-indigo-100' : 'text-indigo-300'}`}>
                {message.replyTo.senderName || 'Message'}
              </p>
              <p className="text-slate-300 text-[11px] truncate opacity-90 mt-0.5">
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Text Content and Inline Timestamp */}
          <div className="flex flex-wrap items-end justify-end gap-x-2 gap-y-0.5">
            <span className="whitespace-pre-wrap break-words flex-1 min-w-[60px]">
              {isDeleted ? 'This message was deleted' : textContent}
            </span>

            {/* Time & Delivery Status inside bubble */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] select-none leading-none flex-shrink-0 ml-auto pt-1 ${
                isMe ? 'text-indigo-100/75' : 'text-slate-400'
              }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isEdited && !isDeleted && <span className="text-[9px] opacity-75">(edited)</span>}
              {isMe && !isDeleted && renderDeliveryStatus()}
            </span>
          </div>
        </div>

        {/* Reaction Badges on bubble corner */}
        {reactionsList.length > 0 && !isDeleted && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${
              isMe ? 'justify-end' : 'justify-start'
            }`}
          >
            {reactionsList.map(({ emoji, count, hasReacted }) => (
              <button
                key={emoji}
                onClick={() => reactToMessage(message._id, emoji)}
                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition cursor-pointer ${
                  hasReacted
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                    : 'bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]'
                }`}
                title={hasReacted ? 'Remove reaction' : `React with ${emoji}`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-semibold">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
