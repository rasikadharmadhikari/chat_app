const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('../config/redis');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (server) => {
  const io = new Server(server, {
  cors: {
    origin: [
      'https://chat-app-ashen-five-13.vercel.app',
      'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

   socket.on('joinConversation', async (conversationId) => {
  socket.join(conversationId);
  console.log('Socket', socket.id, 'joined room:', conversationId);

  await Message.updateMany(
    {
      conversationId,
      readBy: { $nin: [socket.userId] },
      sender: { $ne: socket.userId },
    },
    { $addToSet: { readBy: socket.userId } }
  );

  socket.emit('messagesRead', { conversationId });
});

    socket.on('sendMessage', async ({ conversationId, content, attachments }) => {
      console.log('sendMessage event received:', conversationId, content);
      try {
        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          content,
          attachments: attachments || [],
          readBy: [socket.userId],
        });

        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

        const populatedMessage = await message.populate('sender', 'name avatar');

        console.log('Emitting newMessage to room:', conversationId);
        io.to(conversationId).emit('newMessage', populatedMessage);
      } catch (err) {
        console.error('sendMessage error:', err.message);
        socket.emit('errorMessage', { message: err.message });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('userTyping', { userId: socket.userId, conversationId });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(conversationId).emit('userStopTyping', { userId: socket.userId, conversationId });
    });

    socket.on('messageRead', async ({ messageId }) => {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: socket.userId } });
      socket.broadcast.emit('messageReadReceipt', { messageId, userId: socket.userId });
    });

    socket.on('disconnect', async () => {
      await redisClient.srem('online_users', socket.userId);
      socket.broadcast.emit('userOffline', socket.userId);
      console.log('User disconnected:', socket.userId);
    });

    redisClient.sadd('online_users', socket.userId).then(() => {
      socket.broadcast.emit('userOnline', socket.userId);
    });
  });

  return io;
};