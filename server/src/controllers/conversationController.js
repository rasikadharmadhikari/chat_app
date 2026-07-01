const { createConversation, getUserConversations } = require('../services/conversationService');

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
    const conversations = await getUserConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { create, list };