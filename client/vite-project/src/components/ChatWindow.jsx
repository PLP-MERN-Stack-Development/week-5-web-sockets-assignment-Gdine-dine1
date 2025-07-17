import React, { useRef, useEffect } from 'react';

const ChatWindow = ({ messages, typingUsers, onSendMessage, onTyping, username, onReact, onRead, onSendFile, onLoadMore, loadingMore }) => {
  const inputRef = useRef();
  const messagesEndRef = useRef();
  const messagesContainerRef = useRef();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when rendered
  useEffect(() => {
    messages.forEach((msg) => {
      if (!msg.system && onRead && !msg.readBy?.includes(username)) {
        onRead(msg.id);
      }
    });
  }, [messages, onRead, username]);

  // Infinite scroll: load more when scrolled to top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadMore) return;
    const handleScroll = () => {
      if (container.scrollTop === 0) {
        onLoadMore();
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore]);

  const handleSend = (e) => {
    e.preventDefault();
    const value = inputRef.current.value.trim();
    if (value) {
      onSendMessage(value);
      inputRef.current.value = '';
      onTyping(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onSendFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSendFile({
          name: file.name,
          type: file.type,
          data: event.target.result,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleInput = (e) => {
    onTyping(e.target.value.length > 0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {loadingMore && (
          <div className="text-center text-gray-400 mb-2">Loading...</div>
        )}
        {messages.map((msg, idx) => (
          <div key={msg.id || msg._id || idx} className={`mb-2 ${msg.system ? 'text-gray-400 italic' : msg.sender === username ? 'text-blue-600' : 'text-gray-800'}`}>
            {msg.system ? (
              <em>{msg.message}</em>
            ) : (
              <>
                <span className="font-semibold">{msg.sender}</span>{' '}
                <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>: {msg.message}
                {msg.file && (
                  <div className="mt-2">
                    {msg.file.type.startsWith('image/') ? (
                      <img src={msg.file.data} alt={msg.file.name} className="max-w-xs max-h-52 block mt-1 rounded" />
                    ) : (
                      <a href={msg.file.data} download={msg.file.name} className="text-blue-600 underline">
                        {msg.file.name}
                      </a>
                    )}
                  </div>
                )}
                <div className="mt-1 flex items-center flex-wrap gap-1">
                  {["👍", "❤️", "😂"].map((icon) => (
                    <button
                      key={icon}
                      className="mr-1 text-lg hover:scale-110 transition-transform"
                      onClick={() => onReact && onReact(msg.id, icon)}
                      title={`React with ${icon}`}
                      type="button"
                    >
                      {icon}
                    </button>
                  ))}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <span className="ml-2 text-sm">
                      {msg.reactions.map((r) => (
                        <span key={r.username + r.reaction} title={r.username} className="mr-1">{r.reaction}</span>
                      ))}
                    </span>
                  )}
                  {msg.readBy && msg.readBy.length > 0 && (
                    <span className="text-xs text-gray-400 ml-2">Read by: {msg.readBy.join(', ')}</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="min-h-[1.5em] text-gray-400 pl-4">
        {typingUsers.length > 0 && (
          <span>{typingUsers.filter((u) => u !== username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
        )}
      </div>
      <form onSubmit={handleSend} className="flex p-4 border-t bg-white gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          onInput={handleInput}
          className="flex-1 mr-2 p-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
        />
        <input
          type="file"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="mr-2"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow; 