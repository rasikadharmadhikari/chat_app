from pathlib import Path

p = Path('server/src/services/authService.js')
text = p.read_text(encoding='utf-8')
old = """const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};"""
new = """const loginUser = async ({ email, password }) => {
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
};"""
if old not in text:
    raise SystemExit('target block not found')
p.write_text(text.replace(old, new), encoding='utf-8')
print('updated authService.js')
