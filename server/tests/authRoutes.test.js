const request = require('supertest');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectTestDB, disconnectTestDB } = require('./setup');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test_access_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Auth Routes', () => {
  let accessToken;

  test('POST /api/auth/register — should register successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rasika',
        email: 'rasika@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('rasika@example.com');
  });

  test('POST /api/auth/register — should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rasika',
        email: 'rasika@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });

  test('POST /api/auth/login — should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rasika@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  test('POST /api/auth/login — should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rasika@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('POST /api/auth/logout — should logout successfully', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});