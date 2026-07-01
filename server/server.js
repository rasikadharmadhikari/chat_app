require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();
const server = http.createServer(app);
const userRoutes = require('./src/routes/userRoutes');

connectDB();

require('./src/models/User');
require('./src/models/Conversation');
require('./src/models/Message');

// Middleware must be registered BEFORE routes
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes); 

app.get('/', (req, res) => {
  res.send('Server is running');
});

require('./src/sockets/chatSocket')(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
