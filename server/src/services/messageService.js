const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const sendMessage = async ({ conversationId, sender, content, attachments }) => {
  const message = await Message.create({
    conversationId,
    sender,
    content,
    attachments: attachments || [],
    readBy: [sender],
  });

  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

  return message.populate('sender', 'name avatar');
};

const getMessages = async (conversationId, { cursor, limit = 20 }) => {
  const query = { conversationId };
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar');

  return messages.reverse();
};

module.exports = { sendMessage, getMessages };