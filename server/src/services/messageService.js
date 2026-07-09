const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const sendMessage = async ({ conversationId, sender, content, attachments, replyTo }) => {
  const message = await Message.create({
    conversationId,
    sender,
    content,
    attachments: attachments || [],
    readBy: [sender],
    replyTo: replyTo || null,
  });

  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

  const populated = await message.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name' } },
  ]);

  return populated;
};

const getMessages = async (conversationId, { cursor, limit = 20 }) => {
  const query = { conversationId };
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar')
    .populate({
      path: 'replyTo',
      select: 'content sender isDeleted',
      populate: { path: 'sender', select: 'name' },
    });

  return messages.reverse();
};

module.exports = { sendMessage, getMessages };