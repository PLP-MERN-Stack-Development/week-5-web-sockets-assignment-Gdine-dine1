import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../socket/socket';
import ChatWindow from '../components/ChatWindow';
import UserList from '../components/UserList';
import NotificationSound from '../components/NotificationSound';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

const chatAppStyle = {
  display: 'flex',
  height: '100vh',
  background: '#f3f4f6',
  position: 'relative',
};
const chatMainStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#f9fafb',
  borderRadius: 12,
  margin: 24,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};
const userListToggleStyle = {
  display: 'none',
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 20,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '8px 20px',
  fontWeight: 600,
  cursor: 'pointer',
};

const ChatPage = ({ username }) => {
  const {
    messages,
    users,
    typingUsers,
    sendMessage,
    setTyping,
    sendPrivateMessage,
    reactToMessage,
    readMessage,
    sendFile,
    connect,
  } = useSocket();

  // const { logout } = useAuth();
  // const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const soundRef = useRef();
  const windowFocused = useRef(true);
  const lastMessageId = useRef(messages.length ? messages[messages.length - 1].id : null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [userListOpen, setUserListOpen] = useState(false);

  // Initialize localMessages on mount
  useEffect(() => {
    setLocalMessages(messages);
  }, []);

  // Listen for new messages and append
  useEffect(() => {
    if (messages.length === 0) return;
    const lastLocal = localMessages[localMessages.length - 1];
    const lastGlobal = messages[messages.length - 1];
    if (!lastLocal || lastGlobal.id !== lastLocal.id) {
      setLocalMessages((prev) => [...prev, lastGlobal]);
    }
  }, [messages]);

  // Load more messages (pagination)
  const handleLoadMore = async () => {
    if (loadingMore || allLoaded || localMessages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = localMessages[0];
      const older = await fetchMessages({ before: oldest.timestamp, limit: 20 });
      if (older.length === 0) setAllLoaded(true);
      setLocalMessages((prev) => [...older, ...prev]);
    } catch (e) {
      // ignore
    }
    setLoadingMore(false);
  };

  // Connect socket when username is available
  useEffect(() => {
    if (username) {
      connect(username);
    }
  }, [username, connect]);

  // Track window focus
  useEffect(() => {
    const onFocus = () => {
      windowFocused.current = true;
      setUnread(0);
      document.title = 'Chat App';
    };
    const onBlur = () => {
      windowFocused.current = false;
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Play sound and show browser notification for new messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMessageId.current === lastMsg.id) return;
    lastMessageId.current = lastMsg.id;
    if (!lastMsg.system && lastMsg.sender !== username) {
      if (!windowFocused.current) {
        setUnread((u) => u + 1);
        document.title = `(${unread + 1}) New message - Chat App`;
        if (soundRef.current) soundRef.current.play();
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(`${lastMsg.sender}: ${lastMsg.message || (lastMsg.file ? lastMsg.file.name : '')}`);
        }
      }
    }
  }, [messages, username, unread]);

  // Request browser notification permission
  useEffect(() => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSendMessage = (msg) => {
    if (selectedUser && selectedUser.username !== username) {
      sendPrivateMessage(selectedUser.id, msg);
    } else {
      sendMessage(msg, username);
    }
  };

  return (
    <div style={chatAppStyle}>
      <NotificationSound ref={soundRef} />
      <button
        style={userListToggleStyle}
        onClick={() => setUserListOpen((open) => !open)}
      >
        {userListOpen ? 'Close Users' : 'Users'}
      </button>
      <UserList users={users} currentUser={username} onSelectUser={setSelectedUser} open={userListOpen} />
      <div style={chatMainStyle}>
        <ChatWindow
          messages={localMessages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={setTyping}
          username={username}
          onReact={(messageId, reaction) => reactToMessage(messageId, reaction, username)}
          onRead={(messageId) => readMessage(messageId, username)}
          onSendFile={(file) => sendFile(file, username)}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      </div>
    </div>
  );
};

export default ChatPage; 