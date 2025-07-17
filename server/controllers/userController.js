const User = require('../models/User');

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users.map(u => ({ username: u.username, id: u.socketId })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
}; 