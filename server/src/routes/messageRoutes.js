const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { send, list } = require('../controllers/messageController');

router.use(protect);
router.post('/', send);
router.get('/:id', list);

module.exports = router;