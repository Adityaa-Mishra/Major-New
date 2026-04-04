const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadChatMedia } = require('../middleware/uploads');
const router = express.Router();

const getRoom = (userId, providerId) => [userId, providerId].sort().join('_');
const toPublicUploadPath = (fullPath) => {
  const normalized = String(fullPath || '').replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/uploads/');
  return idx >= 0 ? normalized.slice(idx) : '';
};

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadChatMedia(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// GET /api/chat/conversations - get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort({ createdAt: -1 });

    const convMap = {};
    for (const msg of messages) {
      const otherId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
      if (!convMap[otherId]) convMap[otherId] = msg;
    }

    const conversations = await Promise.all(Object.entries(convMap).map(async ([otherId, lastMsg]) => {
      const other = await User.findById(otherId).select('name avatar isOnline role');
      const unread = await Message.countDocuments({ sender: otherId, receiver: req.user._id, read: false });
      return { user: other, lastMessage: lastMsg, unreadCount: unread };
    }));

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:userId - get messages with a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const room = getRoom(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ room })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    await Message.updateMany({ room, receiver: req.user._id, read: false }, { read: true });
    const otherUser = await User.findById(req.params.userId).select('name avatar isOnline role lastSeen');
    res.json({ messages, otherUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/:userId - send message (user only can initiate, provider can reply)
router.post('/:userId', auth, async (req, res) => {
  try {
    await runUpload(req, res);
    const rawContent = typeof req.body.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message text or media is required' });
    }

    const receiver = await User.findById(req.params.userId);
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    // Only users can initiate chat
    if (req.user.role === 'provider') {
      const room = getRoom(req.user._id.toString(), req.params.userId);
      const existingChat = await Message.findOne({ room });
      if (!existingChat) return res.status(403).json({ message: 'Only users can initiate a conversation' });
    }

    const room = getRoom(req.user._id.toString(), req.params.userId);
    let type = 'text';
    let mediaUrl = '';
    let mediaName = '';
    let mediaSize = 0;
    let mimeType = '';

    if (req.file) {
      type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      mediaUrl = toPublicUploadPath(req.file.path);
      mediaName = req.file.originalname || '';
      mediaSize = req.file.size || 0;
      mimeType = req.file.mimetype || '';
    }

    const message = await Message.create({
      room,
      sender: req.user._id,
      receiver: req.params.userId,
      content,
      type,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType
    });
    await message.populate('sender', 'name avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(room).emit('chat:message', message);
      const receiverSocketId = io.onlineUsers?.get?.(req.params.userId);
      if (receiverSocketId) {
        const preview = message.type === 'text'
          ? message.content
          : `${message.type === 'video' ? 'Video' : 'Image'}: ${message.mediaName || 'attachment'}`;
        io.to(receiverSocketId).emit('chat:notification', {
          from: req.user._id.toString(),
          senderName: req.user.name,
          content: preview,
          room
        });
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    if (err.message?.includes('File too large')) {
      return res.status(400).json({ message: 'Media size must be 25MB or less' });
    }
    if (err.message?.includes('Only image and video files')) {
      return res.status(400).json({ message: 'Only image and video files are allowed' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
