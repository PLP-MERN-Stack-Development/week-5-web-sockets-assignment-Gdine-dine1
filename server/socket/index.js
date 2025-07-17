const User = require('../models/User');
const Message = require('../models/Message');

const setupSocket = (io) => {
  const joinedSockets = new Set();
  const socketUsers = new Map(); // Track socket users in memory
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on('user_join', async (username) => {
      console.log('Received user_join event:', { username, socketId: socket.id, type: typeof username });
      
      // Prevent duplicate join events for the same socket
      if (joinedSockets.has(socket.id)) {
        console.log(`Socket ${socket.id} already joined, ignoring duplicate join`);
        return;
      }
      joinedSockets.add(socket.id);
      
      try {
        // Validate username
        if (!username || typeof username !== 'string' || username.trim() === '') {
          console.error('Invalid username received:', username);
          socket.emit('error_message', { error: 'Invalid username provided' });
          return;
        }
        
        // Track socket user in memory
        socketUsers.set(socket.id, { username, socketId: socket.id });
        
        // For socket connections, we don't need to create a full User record
        // Just track the socket connection
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          existingUser.socketId = socket.id;
          await existingUser.save();
        }
        // Note: We don't create a new User record here since socket users don't have passwords
        
        // Combine database users and socket users
        const dbUsers = await User.find({});
        const allUsers = [
          ...dbUsers.map(u => ({ username: u.username, id: u.socketId })),
          ...Array.from(socketUsers.values()).map(u => ({ username: u.username, id: u.socketId }))
        ];
        io.emit('user_list', allUsers);
        io.emit('user_joined', { username, id: socket.id });
        console.log(`${username} joined the chat`);
      } catch (err) {
        console.error('Error in user_join:', err);
        socket.emit('error_message', { error: 'Failed to join chat', details: err.message });
      }
    });

    // Handle chat messages
    socket.on('send_message', async (messageData) => {
      console.log('Received send_message event:', { messageData, socketId: socket.id });
      
      try {
        // Validate message data
        if (!messageData || typeof messageData !== 'object') {
          console.error('Invalid messageData received:', messageData);
          socket.emit('error_message', { error: 'Invalid message data provided' });
          return;
        }
        
        const user = await User.findOne({ socketId: socket.id });
        const socketUser = socketUsers.get(socket.id);
        const sender = user ? user.username : socketUser ? socketUser.username : messageData.sender || 'Anonymous';
        const message = await Message.create({
          ...messageData,
          sender,
          senderId: socket.id,
          timestamp: new Date(),
          reactions: [],
          readBy: [],
        });
        io.emit('receive_message', message);
      } catch (err) {
        console.error('Error in send_message:', err);
        socket.emit('error_message', { error: 'Failed to send message', details: err.message });
      }
    });

    // Handle message reactions
    socket.on('react_message', async ({ messageId, reaction, username }) => {
      const msg = await Message.findById(messageId);
      if (msg) {
        msg.reactions = msg.reactions.filter((r) => r.username !== username);
        msg.reactions.push({ username, reaction });
        await msg.save();
        io.emit('update_message', msg);
      }
    });

    // Handle read receipts
    socket.on('read_message', async ({ messageId, username }) => {
      const msg = await Message.findById(messageId);
      if (msg && !msg.readBy.includes(username)) {
        msg.readBy.push(username);
        await msg.save();
        io.emit('update_message', msg);
      }
    });

    // Handle typing indicator
    let typingUsers = {};
    socket.on('typing', async (isTyping) => {
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        if (isTyping) {
          typingUsers[socket.id] = user.username;
        } else {
          delete typingUsers[socket.id];
        }
        io.emit('typing_users', Object.values(typingUsers));
      }
    });

    // Handle private messages
    socket.on('private_message', async ({ to, message }) => {
      try {
        const user = await User.findOne({ socketId: socket.id });
        const socketUser = socketUsers.get(socket.id);
        const sender = user ? user.username : socketUser ? socketUser.username : 'Anonymous';
        const messageData = await Message.create({
          sender,
          senderId: socket.id,
          message,
          timestamp: new Date(),
          isPrivate: true,
        });
        socket.to(to).emit('private_message', messageData);
        socket.emit('private_message', messageData);
      } catch (err) {
        console.error('Error in private_message:', err);
        socket.emit('error_message', { error: 'Failed to send private message', details: err.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      // Remove socket from joined sockets
      joinedSockets.delete(socket.id);
      
      // Remove socket user from memory tracking
      const socketUser = socketUsers.get(socket.id);
      if (socketUser) {
        io.emit('user_left', { username: socketUser.username, id: socket.id });
        socketUsers.delete(socket.id);
      }
      
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        io.emit('user_left', { username: user.username, id: socket.id });
        await user.deleteOne();
      }
      delete typingUsers[socket.id];
      // Update user list with remaining users
      const dbUsers = await User.find({});
      const allUsers = [
        ...dbUsers.map(u => ({ username: u.username, id: u.socketId })),
        ...Array.from(socketUsers.values()).map(u => ({ username: u.username, id: u.socketId }))
      ];
      io.emit('user_list', allUsers);
      io.emit('typing_users', Object.values(typingUsers));
    });
  });
};

module.exports = setupSocket; 