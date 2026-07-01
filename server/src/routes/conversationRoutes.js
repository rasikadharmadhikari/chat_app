const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { create, list } = require('../controllers/conversationController');

router.use(protect);
router.post('/', create);
router.get('/', list);

module.exports = router;