const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('../config/redis');

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

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

  // Redis Adapter
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

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

    // ==========================
    // Join Conversation
    // ==========================
    socket.on('joinConversation', async (conversationId) => {
      try {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined room ${conversationId}`);

        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: socket.userId },
            readBy: { $nin: [socket.userId] },
          },
          {
            $addToSet: { readBy: socket.userId },
          }
        );

        socket.emit('messagesRead', { conversationId });
      } catch (err) {
        socket.emit('errorMessage', { message: err.message });
      }
    });

    // ==========================
    // Send Message
    // ==========================
    socket.on(
      'sendMessage',
      async ({ conversationId, content, attachments, replyTo }) => {
        console.log('sendMessage event received:', conversationId, content);

        try {
          const message = await Message.create({
            conversationId,
            sender: socket.userId,
            content,
            attachments: attachments || [],
            readBy: [socket.userId],
            replyTo: replyTo || null,
          });

          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
          });

          const populatedMessage = await message.populate([
            {
              path: 'sender',
              select: 'name avatar',
            },
            {
              path: 'replyTo',
              select: 'content sender isDeleted',
              populate: {
                path: 'sender',
                select: 'name',
              },
            },
          ]);

          console.log('Emitting newMessage to room:', conversationId);

          io.to(conversationId).emit('newMessage', populatedMessage);
        } catch (err) {
          console.error('sendMessage error:', err.message);
          socket.emit('errorMessage', {
            message: err.message,
          });
        }
      }
    );

    // ==========================
    // Add / Remove Reaction
    // ==========================
    socket.on(
      'addReaction',
      async ({ messageId, emoji, conversationId }) => {
        try {
          const message = await Message.findById(messageId);

          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (reaction) =>
              reaction.userId.toString() === socket.userId &&
              reaction.emoji === emoji
          );

          if (existingIndex !== -1) {
            // Remove reaction
            message.reactions.splice(existingIndex, 1);
          } else {
            // Add reaction
            const user = await User.findById(socket.userId).select('name');

            message.reactions.push({
              emoji,
              userId: socket.userId,
              userName: user?.name || 'Unknown',
            });
          }

          await message.save();

          io.to(conversationId).emit('reactionUpdated', {
            messageId,
            reactions: message.reactions,
          });
        } catch (err) {
          console.error('Reaction error:', err.message);

          socket.emit('errorMessage', {
            message: err.message,
          });
        }
      }
    );

    // ==========================
    // Delete Message
    // ==========================
    socket.on(
      'deleteMessage',
      async ({ messageId, conversationId }) => {
        try {
          const message = await Message.findById(messageId);

          if (!message) {
            return socket.emit('errorMessage', {
              message: 'Message not found',
            });
          }

          if (message.sender.toString() !== socket.userId) {
            return socket.emit('errorMessage', {
              message: 'Cannot delete this message',
            });
          }

          await Message.findByIdAndUpdate(messageId, {
            content: 'This message was deleted',
            isDeleted: true,
            attachments: [],
          });

          io.to(conversationId).emit('messageDeleted', {
            messageId,
            conversationId,
          });
        } catch (err) {
          socket.emit('errorMessage', {
            message: err.message,
          });
        }
      }
    );

    // ==========================
    // Typing Indicator
    // ==========================
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('userTyping', {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(conversationId).emit('userStopTyping', {
        userId: socket.userId,
        conversationId,
      });
    });

    // ==========================
    // Message Read
    // ==========================
    socket.on(
      'messageRead',
      async ({ messageId, conversationId }) => {
        try {
          await Message.findByIdAndUpdate(messageId, {
            $addToSet: {
              readBy: socket.userId,
            },
          });

          io.to(conversationId).emit('messageReadReceipt', {
            messageId,
            userId: socket.userId,
          });
        } catch (err) {
          socket.emit('errorMessage', {
            message: err.message,
          });
        }
      }
    );

    // ==========================
    // Disconnect
    // ==========================
    socket.on('disconnect', async () => {
      try {
        await redisClient.srem('online_users', socket.userId);
        socket.broadcast.emit('userOffline', socket.userId);

        console.log('User disconnected:', socket.userId);
      } catch (err) {
        console.error(err);
      }
    });

    // ==========================
    // Mark User Online
    // ==========================
    redisClient.sadd('online_users', socket.userId).then(() => {
      socket.broadcast.emit('userOnline', socket.userId);
    });
  });

  return io;
};