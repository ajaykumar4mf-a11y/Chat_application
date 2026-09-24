import React, { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import UserAvatar from './UserAvatar';
import { IoCheckmarkDone, IoCopyOutline, IoCheckmark } from 'react-icons/io5';

const Message = ({ message }) => {
  const { authUser } = useAuth();
  const { selectedUser } = useChat();
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const authUserId = authUser?._id || authUser?.id;
  const senderId = message.senderId?._id || message.senderId;
  const isMe = Boolean(authUserId && senderId && String(senderId) === String(authUserId));
  const textContent = message.content || message.message || '';

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
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex items-end gap-2 w-full my-1 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
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
        className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        <div className="relative group/bubble flex items-center">
          {/* Quick Copy Action on Hover (Left of sender bubble) */}
          {isMe && (
            <button
              onClick={handleCopy}
              title="Copy message"
              className="mr-1.5 p-1 rounded-lg text-slate-500 hover:text-slate-200 bg-white/[0.04] opacity-0 group-hover/bubble:opacity-100 transition-all duration-150 cursor-pointer text-xs"
            >
              {copied ? (
                <IoCheckmark className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <IoCopyOutline className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Actual Message Bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-all duration-200 select-text ${
              isMe
                ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white rounded-tr-xs shadow-indigo-600/20 border border-white/10'
                : 'bg-white/[0.08] backdrop-blur-md border border-white/[0.08] text-slate-100 rounded-tl-xs hover:border-white/[0.14]'
            }`}
          >
            <p className="whitespace-pre-wrap">{textContent}</p>
          </div>

          {/* Quick Copy Action on Hover (Right of receiver bubble) */}
          {!isMe && (
            <button
              onClick={handleCopy}
              title="Copy message"
              className="ml-1.5 p-1 rounded-lg text-slate-500 hover:text-slate-200 bg-white/[0.04] opacity-0 group-hover/bubble:opacity-100 transition-all duration-150 cursor-pointer text-xs"
            >
              {copied ? (
                <IoCheckmark className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <IoCopyOutline className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp and Status info */}
        <div
          className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 ${
            isMe ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isMe && (
            <IoCheckmarkDone
              className="w-3.5 h-3.5 text-indigo-400"
              title="Delivered"
            />
          )}
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
