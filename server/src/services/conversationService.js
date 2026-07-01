const Conversation = require('../models/Conversation');

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
  return Conversation.find({ participants: userId })
    .populate('participants', 'name email avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
};

module.exports = { createConversation, getUserConversations };