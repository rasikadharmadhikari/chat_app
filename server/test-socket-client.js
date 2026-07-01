const { io } = require('socket.io-client');

// PASTE A FRESH ACCESS TOKEN HERE (from logging in as test@example.com)
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhM2ZlOGZiZDkxNWRmNDk4MjA1MTUzMCIsImlhdCI6MTc4MjkwMDEzNCwiZXhwIjoxNzgyOTAxMDM0fQ.TPb_oiKUsyvtCIPfAtICr-et3B6JTZcoeOSr2IfJwno";

const socket = io('http://localhost:5000', {
  auth: { token: TOKEN },
});

socket.on('connect', () => {
  console.log('Connected with socket id:', socket.id);

  const conversationId = '6a3ffa18d915df4982051533';
  socket.emit('joinConversation', conversationId);

  socket.emit('sendMessage', {
    conversationId,
    content: 'Hello from the test socket client!',
  });
});

socket.on('newMessage', (msg) => {
  console.log('New message received:', msg);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

socket.on('errorMessage', (err) => {
  console.error('Server reported error:', err);
});