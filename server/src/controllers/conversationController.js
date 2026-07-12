const {
  createConversation,
  getUserConversations,
} = require('../services/conversationService');
const Conversation = require('../models/Conversation');

const create = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body;
    const allParticipants = isGroup
      ? [...participants, req.user.id]
      : [req.user.id, participantId];

    const conversation = await createConversation({
      participants: allParticipants,
      isGroup,
      groupName,
    });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { archived } = req.query;
    const conversations = await getUserConversations(
      req.user.id,
      archived === 'true'
    );
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const pinConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isPinned = conversation.pinnedBy.includes(userId);

    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        (u) => u.toString() !== userId
      );
    } else {
      conversation.pinnedBy.push(userId);
    }

    await conversation.save();
    res.status(200).json({ pinned: !isPinned, conversationId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const archiveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isArchived = conversation.archivedBy.includes(userId);

    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter(
        (u) => u.toString() !== userId
      );
    } else {
      conversation.archivedBy.push(userId);
      conversation.pinnedBy = conversation.pinnedBy.filter(
        (u) => u.toString() !== userId
      );
    }

    await conversation.save();
    res.status(200).json({ archived: !isArchived, conversationId: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { create, list, pinConversation, archiveConversation };