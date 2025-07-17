const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  senderId: { type: String, required: true },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
  reactions: [{ username: String, reaction: String }],
  readBy: [{ type: String }],
  file: {
    name: String,
    type: String,
    data: String, // base64 or data URL
  },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema); 