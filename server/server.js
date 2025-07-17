// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const messageController = require('./controllers/messageController');
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const setupSocket = require('./socket');
const auth = require('./utils/auth');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// TODO: Import and use controllers/routes
// TODO: Import and use socket logic from server/socket

// API routes
app.get('/api/messages', auth, messageController.getMessages);
app.post('/api/messages', auth, messageController.createMessage);
app.get('/api/users', auth, userController.getUsers);
app.post('/api/users', auth, userController.createUser);
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Socket.io events
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 