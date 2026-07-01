const { sendMessage, getMessages } = require('../services/messageService');

const send = async (req, res) => {
  try {
    const { conversationId, content, attachments } = req.body;

    const message = await sendMessage({
      conversationId,
      sender: req.user.id,
      content,
      attachments,
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

    const messages = await getMessages(id, { cursor, limit: Number(limit) || 20 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { send, list };