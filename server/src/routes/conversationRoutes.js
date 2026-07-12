const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { create, list, pinConversation, archiveConversation } = require('../controllers/conversationController');

router.use(protect);
router.post('/', create);
router.get('/', list);
router.patch('/:id/pin', pinConversation);
router.patch('/:id/archive', archiveConversation);

module.exports = router;