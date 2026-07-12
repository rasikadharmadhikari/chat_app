const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { send, list, deleteMessage, searchMessages } = require('../controllers/messageController');

router.use(protect);
router.post('/', send);
router.get('/search', searchMessages);
router.get('/:id', list);
router.delete('/:messageId', deleteMessage);

module.exports = router;