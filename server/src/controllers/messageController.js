const { sendMessage, getMessages } = require('../services/messageService');
const Message = require('../models/Message');

const send = async (req, res) => {
  try {
    const { conversationId, content, attachments, replyTo } = req.body;
    const message = await sendMessage({
      conversationId,
      sender: req.user.id,
      content,
      attachments,
      replyTo,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const messages = await getMessages(id, {
      cursor,
      limit: Number(limit) || 20,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndUpdate(messageId, {
      content: 'This message was deleted',
      isDeleted: true,
      attachments: [],
    });

    res.status(200).json({ messageId, deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query too short' });
    }

    const searchFilter = {
      $text: { $search: query },
      isDeleted: false,
    };

    if (conversationId) {
      searchFilter.conversationId = conversationId;
    }

    const messages = await Message.find(searchFilter)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('sender', 'name avatar')
      .populate('conversationId', 'participants isGroup groupName');

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { send, list, deleteMessage, searchMessages };