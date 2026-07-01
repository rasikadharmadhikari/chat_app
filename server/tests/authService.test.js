const { connectTestDB, disconnectTestDB } = require('./setup');
const { registerUser, loginUser, generateAccessToken } = require('../src/services/authService');

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test_access_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('Auth Service', () => {
  test('should register a new user successfully', async () => {
    const user = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.password).not.toBe('password123');
  });

  test('should not register duplicate email', async () => {
    await expect(
      registerUser({
        name: 'Duplicate User',
        email: 'test@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Email already registered');
  });

  test('should login with correct credentials', async () => {
    const user = await loginUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  test('should fail login with wrong password', async () => {
    await expect(
      loginUser({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Invalid credentials');
  });

  test('should fail login with non-existent email', async () => {
    await expect(
      loginUser({
        email: 'nobody@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('Invalid credentials');
  });

  test('should generate a valid access token', () => {
    const token = generateAccessToken('someUserId123');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});