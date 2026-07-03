const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const createConversation = async ({ participants, isGroup, groupName }) => {
  if (!isGroup && participants.length === 2) {
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 },
    });
    if (existing) return existing;
  }

  const conversation = await Conversation.create({
    participants,
    isGroup: !!isGroup,
    groupName: groupName || '',
  });
  return conversation;
};

const getUserConversations = async (userId) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name email avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        readBy: { $nin: [userId] },
        sender: { $ne: userId },
      });
      return { ...conv.toObject(), unreadCount };
    })
  );

  return conversationsWithUnread;
};

module.exports = { createConversation, getUserConversations };