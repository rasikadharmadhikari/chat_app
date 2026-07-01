const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query too short' });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('name email avatar status').limit(10);

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;