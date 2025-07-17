import { io } from 'socket.io-client';
import { useEffect, useState, useCallback, useRef } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const joinedUsersRef = useRef(new Set());
  const isConnectingRef = useRef(false);

  // Connection events
  const onConnect = useCallback(() => {
    setIsConnected(true);
    isConnectingRef.current = false;
  }, []);

  const onDisconnect = useCallback(() => {
    setIsConnected(false);
    // Reset joined users when disconnected
    joinedUsersRef.current = new Set();
    isConnectingRef.current = false;
  }, []);

  // Message events
  const onReceiveMessage = useCallback((message) => {
    setLastMessage(message);
    setMessages((prev) => [...prev, message]);
  }, []);

  const onPrivateMessage = useCallback((message) => {
    setLastMessage(message);
    setMessages((prev) => [...prev, message]);
  }, []);

  // User events
  const onUserList = useCallback((userList) => {
    setUsers(userList);
    // Initialize joined users with current users
    joinedUsersRef.current = new Set(userList.map(u => u.username));
  }, []);

  const onUserJoined = useCallback((user) => {
    // Only add join message if user hasn't already joined
    if (joinedUsersRef.current.has(user.username)) {
      return; // User already joined, don't add message
    }
    
    // Add user to joined users set
    joinedUsersRef.current = new Set([...joinedUsersRef.current, user.username]);
    
    // Add join message for new user
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        system: true,
        message: `${user.username} joined the chat`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const onUserLeft = useCallback((user) => {
    // Remove user from joined users set
    joinedUsersRef.current = new Set([...joinedUsersRef.current].filter(u => u !== user.username));
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        system: true,
        message: `${user.username} left the chat`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Typing events
  const onTypingUsers = useCallback((users) => {
    setTypingUsers(users);
  }, []);

  const onUpdateMessage = useCallback((updatedMsg) => {
    setMessages((prev) => prev.map((msg) => msg.id === updatedMsg.id ? updatedMsg : msg));
  }, []);

  // Connect to socket server
  const connect = useCallback((username) => {
    // Validate username before connecting
    if (!username || typeof username !== 'string' || username.trim() === '') {
      console.error('Invalid username provided to connect:', username);
      return;
    }
    
    // Prevent multiple connections
    if (isConnectingRef.current || socket.connected) {
      console.log('Already connected or connecting, skipping connect call');
      return;
    }
    
    isConnectingRef.current = true;
    socket.connect();
    socket.emit('user_join', username.trim());
  }, []);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socket.disconnect();
  }, []);

  // Send a message
  const sendMessage = (message, sender) => {
    // Validate message before sending
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error('Invalid message provided to sendMessage:', message);
      return;
    }
    if (!sender || typeof sender !== 'string' || sender.trim() === '') {
      console.error('Invalid sender provided to sendMessage:', sender);
      return;
    }
    socket.emit('send_message', { message: message.trim(), sender: sender.trim() });
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    // Validate parameters before sending
    if (!to || typeof to !== 'string' || to.trim() === '') {
      console.error('Invalid recipient provided to sendPrivateMessage:', to);
      return;
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.error('Invalid message provided to sendPrivateMessage:', message);
      return;
    }
    
    socket.emit('private_message', { to: to.trim(), message: message.trim() });
  };

  // Send a file message
  const sendFile = (file, username) => {
    socket.emit('send_message', { message: '', file, sender: username });
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', isTyping);
  };

  // React to a message
  const reactToMessage = (messageId, reaction, username) => {
    socket.emit('react_message', { messageId, reaction, username });
  };

  // Mark a message as read
  const readMessage = (messageId, username) => {
    socket.emit('read_message', { messageId, username });
  };

  // Fetch messages with pagination
  const fetchMessages = async ({ before, limit, token } = {}) => {
    let url = '/api/messages';
    const params = [];
    if (before) params.push(`before=${encodeURIComponent(before)}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length) url += '?' + params.join('&');
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return await res.json();
  };

  // Socket event listeners
  useEffect(() => {
    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('update_message', onUpdateMessage);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('update_message', onUpdateMessage);
    };
  }, [onConnect, onDisconnect, onReceiveMessage, onPrivateMessage, onUserList, onUserJoined, onUserLeft, onTypingUsers, onUpdateMessage]);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    reactToMessage,
    readMessage,
    sendFile,
    fetchMessages,
  };
}; 