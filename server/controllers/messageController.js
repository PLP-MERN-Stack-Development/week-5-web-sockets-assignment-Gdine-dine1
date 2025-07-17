const Message = require('../models/Message');

// GET /api/messages?before=<timestamp>&limit=<number>
exports.getMessages = async (req, res) => {
  try {
    let { before, limit } = req.query;
    limit = parseInt(limit) || 20;
    let query = {};
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// POST /api/messages
exports.createMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create message' });
  }
}; 