import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function ChatWindow({ conversation, socket, isOnline }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = conversation.participants.find((p) => p._id !== user.id);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${conversation._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('joinConversation', conversation._id);

      socket.on('newMessage', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('userTyping', ({ userId }) => {
        if (userId !== user.id) setIsTyping(true);
      });

      socket.on('userStopTyping', ({ userId }) => {
        if (userId !== user.id) setIsTyping(false);
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('userTyping');
        socket.off('userStopTyping');
      }
    };
  }, [conversation._id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (socket) {
        socket.emit('sendMessage', {
          conversationId: conversation._id,
          content: file.type.startsWith('image/') ? '📷 Image' : '📎 File',
          attachments: [res.data.url],
        });
      }
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      conversationId: conversation._id,
      content: newMessage.trim(),
    });

    setNewMessage('');
    socket.emit('stopTyping', { conversationId: conversation._id });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket) {
      socket.emit('typing', { conversationId: conversation._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { conversationId: conversation._id });
      }, 1500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-100">

      {/* Header */}
<div className="bg-white p-4 shadow flex items-center gap-3">
  <div className="relative">
    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
      {otherUser?.avatar ? (
        <img
          src={otherUser.avatar}
          alt={otherUser.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        otherUser?.name?.charAt(0).toUpperCase()
      )}
    </div>
    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
      isOnline(otherUser?._id) ? 'bg-green-400' : 'bg-gray-400'
    }`} />
  </div>
  <div>
    <p className="font-semibold">{otherUser?.name}</p>
    <p className="text-xs text-gray-500">
      {isOnline(otherUser?._id) ? '🟢 Online' : '⚫ Offline'}
    </p>
  </div>
</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg) => {
          const isOwn = msg.sender._id === user.id || msg.sender === user.id;
          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow rounded-bl-none'
                }`}
              >
                {msg.attachments && msg.attachments.length > 0 ? (
                  <img
                    src={msg.attachments[0]}
                    alt="attachment"
                    className="rounded-lg max-w-full mb-1 cursor-pointer"
                    onClick={() => window.open(msg.attachments[0], '_blank')}
                  />
                ) : null}
                {msg.content}
                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl text-sm text-gray-500 shadow">
              {otherUser?.name} is typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white p-4 flex gap-3 items-center shadow">
        <label className="cursor-pointer text-gray-500 hover:text-blue-600 text-xl">
          📎
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf"
          />
        </label>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>

    </div>
  );
}