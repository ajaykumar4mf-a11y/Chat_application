import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { authUser, setAuthUser } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('chat-unread-counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const cancelReply = () => setReplyingTo(null);
  const cancelEdit = () => setEditingMessage(null);

  // Helper to emit typing events
  const sendTyping = useCallback(
    (receiverId) => {
      if (!socket || !authUser?._id || !receiverId) return;
      socket.emit('typing', { senderId: authUser._id, receiverId });
    },
    [socket, authUser?._id]
  );

  const sendStopTyping = useCallback(
    (receiverId) => {
      if (!socket || !authUser?._id || !receiverId) return;
      socket.emit('stopTyping', { senderId: authUser._id, receiverId });
    },
    [socket, authUser?._id]
  );

  // Helper to play soft notification sound on incoming message
  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio might be suppressed before first user gesture
    }
  };

  // Persist unread counts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chat-unread-counts', JSON.stringify(unreadCounts));
    } catch (e) {
      console.error('Failed to cache unread counts:', e);
    }
  }, [unreadCounts]);

  // Update browser tab title with total unread count
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    if (total > 0) {
      document.title = `(${total}) PulseChat • Real-time Messenger`;
    } else {
      document.title = 'PulseChat • Real-time Messenger';
    }
  }, [unreadCounts]);

  // Fetch all other users
  const fetchUsers = useCallback(async () => {
    if (!authUser) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/user/', {
        credentials: 'include',
      });
      if (res.status === 401) {
        setAuthUser(null);
        localStorage.removeItem('chat-user');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        const userList = Array.isArray(data) ? data : (data.users || []);
        setUsers(userList);

        // Sync initial unread counts from database
        const dbUnread = {};
        userList.forEach((u) => {
          const uid = String(u._id);
          if (u.unreadCount && u.unreadCount > 0) {
            dbUnread[uid] = u.unreadCount;
          }
        });
        setUnreadCounts((prev) => ({
          ...dbUnread,
          ...prev,
        }));
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch other users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [authUser, setAuthUser]);

  // Fetch messages for selected user
  const fetchMessages = useCallback(async (userId) => {
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/message/${userId}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setAuthUser(null);
        localStorage.removeItem('chat-user');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [setAuthUser]);

  // When authUser changes, load users
  useEffect(() => {
    if (authUser) {
      fetchUsers();
    } else {
      setUsers([]);
      setSelectedUser(null);
      setMessages([]);
      setUnreadCounts({});
      setTypingUsers({});
      setIsMobileChatOpen(false);
    }
  }, [authUser, fetchUsers]);

  // When selected user changes, load their messages and clear unread count
  useEffect(() => {
    if (selectedUser?._id) {
      const uid = String(selectedUser._id);
      fetchMessages(selectedUser._id);
      setUnreadCounts((prev) => {
        if (!prev[uid]) return prev;
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
      setUsers((prev) =>
        prev.map((u) => (String(u._id) === uid ? { ...u, unreadCount: 0 } : u))
      );
      fetch(`/api/message/seen/${uid}`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [selectedUser, fetchMessages]);

  // Listen for real-time incoming messages, delivery, seen receipts, and typing events via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (!newMessage) return;

      const senderIdStr = String(newMessage.senderId?._id || newMessage.senderId);
      const selectedUserIdStr = String(selectedUser?._id);

      // Dismiss typing indicator for this sender upon new message receipt
      setTypingUsers((prev) => {
        if (!prev[senderIdStr]) return prev;
        const updated = { ...prev };
        delete updated[senderIdStr];
        return updated;
      });

      // Play soft notification sound
      playNotificationSound();

      // Update lastMessage in users list
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (String(u._id) === senderIdStr || String(u._id) === String(newMessage.receiverId)) {
            return {
              ...u,
              lastMessage: {
                _id: newMessage._id,
                content: newMessage.content,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
                delivered: true,
                seen: newMessage.seen || false,
              },
            };
          }
          return u;
        })
      );

      // If the message is from the user we are currently actively viewing
      if (selectedUser && senderIdStr === selectedUserIdStr) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m._id) === String(newMessage._id));
          if (exists) return prev;
          return [...prev, { ...newMessage, delivered: true, seen: true }];
        });
        // Acknowledge seen to the server
        fetch(`/api/message/seen/${selectedUser._id}`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {});
      } else {
        // Increment unread message count for this sender (1, 2, 3...)
        setUnreadCounts((prev) => ({
          ...prev,
          [senderIdStr]: (prev[senderIdStr] || 0) + 1,
        }));
      }
    };

    const handleMessagesDelivered = ({ receiverId }) => {
      if (!receiverId) return;
      const rId = String(receiverId);

      setMessages((prev) =>
        prev.map((msg) => {
          const msgRec = String(msg.receiverId?._id || msg.receiverId);
          if (msgRec === rId && !msg.seen) {
            return { ...msg, delivered: true };
          }
          return msg;
        })
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (String(u._id) === rId && u.lastMessage) {
            return {
              ...u,
              lastMessage: { ...u.lastMessage, delivered: true },
            };
          }
          return u;
        })
      );
    };

    const handleMessagesSeen = ({ seenBy }) => {
      if (!seenBy) return;
      const sId = String(seenBy);

      setMessages((prev) =>
        prev.map((msg) => {
          const receiverStr = String(msg.receiverId?._id || msg.receiverId);
          if (receiverStr === sId) {
            return { ...msg, seen: true, delivered: true };
          }
          return msg;
        })
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (String(u._id) === sId && u.lastMessage) {
            return {
              ...u,
              lastMessage: { ...u.lastMessage, seen: true, delivered: true },
            };
          }
          return u;
        })
      );
    };

    const handleUserTyping = ({ senderId }) => {
      if (!senderId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [String(senderId)]: true,
      }));
    };

    const handleUserStoppedTyping = ({ senderId }) => {
      if (!senderId) return;
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[String(senderId)];
        return updated;
      });
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(messageId) ? { ...msg, reactions } : msg
        )
      );
    };

    const handleMessageEdited = ({ messageId, content, isEdited }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(messageId)
            ? { ...msg, content, isEdited: true }
            : msg
        )
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.lastMessage && String(u.lastMessage._id) === String(messageId)) {
            return {
              ...u,
              lastMessage: {
                ...u.lastMessage,
                content,
              },
            };
          }
          return u;
        })
      );
    };

    const handleMessageDeleted = ({ messageId, isDeleted }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(messageId)
            ? {
                ...msg,
                content: 'This message was deleted',
                isDeleted: true,
                reactions: [],
              }
            : msg
        )
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.lastMessage && String(u.lastMessage._id) === String(messageId)) {
            return {
              ...u,
              lastMessage: {
                ...u.lastMessage,
                content: 'This message was deleted',
                isDeleted: true,
              },
            };
          }
          return u;
        })
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesDelivered', handleMessagesDelivered);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesDelivered', handleMessagesDelivered);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, selectedUser]);

  const clearUnreadCount = (userId) => {
    if (!userId) return;
    const uid = String(userId);
    setUnreadCounts((prev) => {
      if (!prev[uid]) return prev;
      const updated = { ...prev };
      delete updated[uid];
      return updated;
    });
    setUsers((prev) =>
      prev.map((u) => (String(u._id) === uid ? { ...u, unreadCount: 0 } : u))
    );
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setIsMobileChatOpen(true);
    setReplyingTo(null);
    setEditingMessage(null);
    if (user?._id) {
      clearUnreadCount(user._id);
    }
  };

  const closeMobileChat = () => {
    setIsMobileChatOpen(false);
  };

  // Send message (with optional replyTo)
  const sendMessage = async (content, replyData = null) => {
    if (!selectedUser?._id || !content?.trim() || isSending) return false;
    setIsSending(true);

    const text = content.trim();
    const replyTarget = replyData || replyingTo;

    try {
      const res = await fetch(`/api/message/send/${selectedUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          replyTo: replyTarget
            ? {
                _id: replyTarget._id,
                content: replyTarget.content || replyTarget.message,
                senderName:
                  replyTarget.senderName ||
                  (String(replyTarget.senderId?._id || replyTarget.senderId) ===
                  String(authUser?._id)
                    ? 'You'
                    : selectedUser.fullName),
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.newMessage) {
        sendStopTyping(selectedUser._id);
        setReplyingTo(null);
        setMessages((prev) => [...prev, data.newMessage]);
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            String(u._id) === String(selectedUser._id)
              ? {
                  ...u,
                  lastMessage: {
                    _id: data.newMessage._id,
                    content: data.newMessage.content,
                    senderId: data.newMessage.senderId,
                    createdAt: data.newMessage.createdAt,
                    delivered: data.newMessage.delivered || false,
                    isDeleted: false,
                    seen: false,
                  },
                }
              : u
          )
        );
        setIsSending(false);
        return true;
      } else {
        console.error('Failed to send message:', data.error);
        setIsSending(false);
        return false;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setIsSending(false);
      return false;
    }
  };

  // React to a message
  const reactToMessage = async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    try {
      const res = await fetch(`/api/message/react/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (res.ok && data.reactions) {
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg._id) === String(messageId)
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  };

  // Edit a message
  const editMessage = async (messageId, newContent) => {
    if (!messageId || !newContent?.trim()) return false;
    try {
      const res = await fetch(`/api/message/edit/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newContent.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setEditingMessage(null);
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg._id) === String(messageId)
              ? { ...msg, content: data.message.content, isEdited: true }
              : msg
          )
        );
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u.lastMessage && String(u.lastMessage._id) === String(messageId)) {
              return {
                ...u,
                lastMessage: {
                  ...u.lastMessage,
                  content: data.message.content,
                },
              };
            }
            return u;
          })
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to edit message:', err);
      return false;
    }
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    if (!messageId) return false;
    try {
      const res = await fetch(`/api/message/delete/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg._id) === String(messageId)
              ? {
                  ...msg,
                  content: 'This message was deleted',
                  isDeleted: true,
                  reactions: [],
                }
              : msg
          )
        );
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u.lastMessage && String(u.lastMessage._id) === String(messageId)) {
              return {
                ...u,
                lastMessage: {
                  ...u.lastMessage,
                  content: 'This message was deleted',
                  isDeleted: true,
                },
              };
            }
            return u;
          })
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete message:', err);
      return false;
    }
  };

  // Filtered users by search query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.userName?.toLowerCase().includes(q)
    );
  });

  const value = {
    users,
    filteredUsers,
    loadingUsers,
    selectedUser,
    setSelectedUser,
    selectUser,
    messages,
    loadingMessages,
    isSending,
    sendMessage,
    searchQuery,
    setSearchQuery,
    isMobileChatOpen,
    closeMobileChat,
    fetchUsers,
    fetchMessages,
    unreadCounts,
    clearUnreadCount,
    typingUsers,
    sendTyping,
    sendStopTyping,
    replyingTo,
    setReplyingTo,
    cancelReply,
    editingMessage,
    setEditingMessage,
    cancelEdit,
    reactToMessage,
    editMessage,
    deleteMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
