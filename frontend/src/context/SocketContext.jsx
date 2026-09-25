import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuth();

  useEffect(() => {
    if (!authUser?._id) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://chat-application-backend-eafa.onrender.com';
    const newSocket = io(BACKEND_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users || []);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [authUser?._id]);

  const value = {
    socket,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
