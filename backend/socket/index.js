const Message = require('../models/Message');

const getRoom = (a, b) => [a, b].sort().join('_');

module.exports = (io) => {
  const onlineUsers = new Map();
  io.onlineUsers = onlineUsers;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('user:online', async (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('chat:join', ({ userId, partnerId }) => {
      const room = getRoom(userId, partnerId);
      socket.join(room);
      socket.currentRoom = room;
    });

    socket.on('chat:typing', ({ senderId, receiverId, isTyping }) => {
      const room = getRoom(senderId, receiverId);
      socket.to(room).emit('chat:typing', { senderId, isTyping });
    });

    socket.on('chat:read', async ({ userId, partnerId }) => {
      const room = getRoom(userId, partnerId);
      await Message.updateMany({ room, receiver: userId, read: false }, { read: true });
      socket.to(room).emit('chat:read', { userId });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
};
