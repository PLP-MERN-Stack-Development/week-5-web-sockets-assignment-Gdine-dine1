const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  socketId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 