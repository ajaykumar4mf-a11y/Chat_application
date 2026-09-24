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
        <span className="flex items-center text-sky-400 transition-colors" title="Seen">
          <IoCheckmarkDone className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (isDelivered) {
      return (
        <span className="flex items-center text-slate-400" title="Delivered">
          <IoCheckmarkDone className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span className="flex items-center text-slate-400" title="Sent">
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
      className={`group relative flex items-end gap-2 w-full my-1.5 transition-all duration-200 ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Receiver avatar on the left */}
      {!isMe && (
        <UserAvatar
          user={selectedUser}
          size="xs"
          showStatus={false}
          className="mb-1 hidden sm:block"
        />
      )}

      {/* Bubble + Timestamp Wrapper */}
      <div
        className={`relative flex flex-col max-w-[85%] sm:max-w-[70%] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Floating Quick Actions Bar on Hover (above bubble) */}
        {!isDeleted && (
          <div
            className={`absolute -top-7 z-10 hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl bg-[#0d1220]/95 backdrop-blur-xl border border-white/[0.12] shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {/* Quick Reaction Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker((prev) => !prev)}
                title="React"
                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] transition-all cursor-pointer text-xs"
              >
                <IoHappyOutline className="w-3.5 h-3.5" />
              </button>

              {/* Reaction Popup */}
              {showReactionPicker && (
                <div className="absolute bottom-8 left-0 z-30 flex items-center gap-1 p-1 rounded-2xl bg-[#090d16]/98 backdrop-blur-2xl border border-white/[0.15] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="w-7 h-7 rounded-xl hover:bg-white/[0.1] hover:scale-120 flex items-center justify-center text-sm transition-all cursor-pointer"
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
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/[0.08] transition-all cursor-pointer text-xs"
            >
              <IoArrowUndoOutline className="w-3.5 h-3.5" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer text-xs"
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
                className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-white/[0.08] transition-all cursor-pointer text-xs"
              >
                <IoPencilOutline className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Button (Sender only) */}
            {isMe && (
              <button
                onClick={handleDelete}
                title="Delete for everyone"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-all cursor-pointer text-xs"
              >
                <IoTrashOutline className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Actual Message Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-all duration-200 select-text ${
            isDeleted
              ? 'bg-white/[0.03] border border-white/[0.05] text-slate-400 italic rounded-2xl'
              : isMe
              ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-tr-xs shadow-indigo-600/20 border border-white/10'
              : 'bg-white/[0.08] backdrop-blur-md border border-white/[0.08] text-slate-100 rounded-tl-xs hover:border-white/[0.14]'
          }`}
        >
          {/* Quoted Message Card (if message is a reply) */}
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
              className="mb-2 p-2 rounded-xl bg-black/25 border-l-3 border-indigo-400 text-xs cursor-pointer hover:bg-black/35 transition-all text-left"
            >
              <p className="font-semibold text-indigo-300 text-[11px] truncate">
                {message.replyTo.senderName || 'Message'}
              </p>
              <p className="text-slate-300 text-[11px] truncate opacity-90">
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Text Content */}
          <p className="whitespace-pre-wrap">
            {isDeleted ? '🚫 This message was deleted' : textContent}
          </p>
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
                className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                  hasReacted
                    ? 'bg-indigo-600/40 border-indigo-500/70 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-white/[0.06] border-white/[0.08] text-slate-300 hover:bg-white/[0.1]'
                }`}
                title={hasReacted ? 'Remove reaction' : 'React with ' + emoji}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and Status info */}
        <div
          className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isEdited && !isDeleted && (
            <span className="text-[9px] text-slate-400 italic">(edited)</span>
          )}
          {isMe && !isDeleted && renderDeliveryStatus()}
        </div>
      </div>

      {/* Sender avatar on the right */}
      {isMe && (
        <UserAvatar
          user={authUser}
          size="xs"
          showStatus={false}
          className="mb-1 hidden sm:block"
        />
      )}
    </div>
  );
};

export default Message;
