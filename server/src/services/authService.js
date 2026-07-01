const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  return user;
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(normalizedPassword, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  registerUser,
  loginUser,
};