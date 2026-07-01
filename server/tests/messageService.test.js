const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB } = require('./setup');
const { sendMessage, getMessages } = require('../src/services/messageService');
const Conversation = require('../src/models/Conversation');
const User = require('../src/models/User');

let testConversation;
let testUser;

beforeAll(async () => {
  await connectTestDB();

  testUser = await User.create({
    name: 'Test User',
    email: 'test@test.com',
    password: 'hashedpassword',
  });

  testConversation = await Conversation.create({
    participants: [testUser._id],
    isGroup: false,
  });
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Message Service', () => {
  test('should send a message successfully', async () => {
    const message = await sendMessage({
      conversationId: testConversation._id,
      sender: testUser._id,
      content: 'Hello world',
    });

    expect(message).toBeDefined();
    expect(message.content).toBe('Hello world');
    expect(message.conversationId.toString()).toBe(
      testConversation._id.toString()
    );
  });

  test('should fetch messages for a conversation', async () => {
    const messages = await getMessages(testConversation._id, {});
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].content).toBe('Hello world');
  });

  test('should return empty array for conversation with no messages', async () => {
    const emptyConversation = await Conversation.create({
      participants: [testUser._id],
      isGroup: false,
    });

    const messages = await getMessages(emptyConversation._id, {});
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(0);
  });
});