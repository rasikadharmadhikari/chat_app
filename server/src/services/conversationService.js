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

const getUserConversations = async (userId, showArchived = false) => {
  const filter = {
    participants: userId,
  };

  if (showArchived) {
    filter.archivedBy = userId;
  } else {
    filter.archivedBy = { $nin: [userId] };
  }

  const conversations = await Conversation.find(filter)
    .populate('participants', 'name email avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  const conversationsWithMeta = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        readBy: { $nin: [userId] },
        sender: { $ne: userId },
      });

      return {
        ...conv.toObject(),
        unreadCount,
        isPinned: conv.pinnedBy?.includes(userId) || false,
        isArchived: conv.archivedBy?.includes(userId) || false,
      };
    })
  );

  return conversationsWithMeta.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
};

module.exports = { createConversation, getUserConversations };