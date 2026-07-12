import SearchMessages from './SearchMessages';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatWindow({ conversation, socket, isOnline }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);

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
    setReplyingTo(null);

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

      socket.on('messagesRead', ({ conversationId }) => {
        if (conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              readBy: Array.isArray(msg.readBy)
                ? [...new Set([...msg.readBy, otherUser?._id])]
                : msg.readBy,
            }))
          );
        }
      });

      socket.on('messageDeleted', ({ messageId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, content: 'This message was deleted', isDeleted: true, attachments: [] }
              : msg
          )
        );
      });

      socket.on('reactionUpdated', ({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('userTyping');
        socket.off('userStopTyping');
        socket.off('messagesRead');
        socket.off('messageDeleted');
        socket.off('reactionUpdated');
      }
    };
  }, [conversation._id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('addReaction', {
      messageId,
      emoji,
      conversationId: conversation._id,
    });
    setShowEmojiPicker(null);
    setHoveredMessage(null);
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
    setHoveredMessage(null);
  };

  const handleCancelReply = () => setReplyingTo(null);

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: 'This message was deleted', isDeleted: true, attachments: [] }
            : msg
        )
      );
      if (socket) {
        socket.emit('deleteMessage', {
          messageId,
          conversationId: conversation._id,
        });
      }
      setHoveredMessage(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

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
          replyTo: replyingTo?._id || null,
        });
        setReplyingTo(null);
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
      replyTo: replyingTo?._id || null,
    });
    setNewMessage('');
    setReplyingTo(null);
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
    if (e.key === 'Escape') handleCancelReply();
  };

  const getSenderName = (msg) => {
    if (msg.sender._id === user.id || msg.sender === user.id) return 'You';
    return msg.sender.name || otherUser?.name || 'Unknown';
  };

  const groupReactions = (reactions = []) => {
    const grouped = {};
    reactions.forEach((r) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.userName);
    });
    return grouped;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-100 dark:bg-gray-950">

      {/* Header */}
<div className="bg-white dark:bg-gray-900 p-4 shadow flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    {conversation.isGroup ? (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">👥</div>
        <div>
          <p className="font-semibold dark:text-white">{conversation.groupName}</p>
          <p className="text-xs text-gray-500">{conversation.participants.length} members</p>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
            {otherUser?.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
            ) : (
              otherUser?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline(otherUser?._id) ? 'bg-green-400' : 'bg-gray-400'
          }`} />
        </div>
        <div>
          <p className="font-semibold dark:text-white">{otherUser?.name}</p>
          <p className="text-xs text-gray-500">
            {isOnline(otherUser?._id) ? '🟢 Online' : '⚫ Offline'}
          </p>
        </div>
      </div>
    )}
  </div>

  {/* Search button */}
  <button
    onClick={() => setShowSearch(true)}
    className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    title="Search messages"
  >
    🔍
  </button>
</div>

{/* Search modal */}
{showSearch && (
  <SearchMessages
    conversationId={conversation._id}
    onClose={() => setShowSearch(false)}
    onSelectMessage={(msg) => {
      setShowSearch(false);
    }}
  />
)}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
        onClick={() => { setShowEmojiPicker(null); }}
      >
        {messages.map((msg) => {
          const isOwn = msg.sender._id === user.id || msg.sender === user.id;
          const isRead = Array.isArray(msg.readBy) && msg.readBy.length > 1;
          const isDeleted = msg.isDeleted;
          const groupedReactions = groupReactions(msg.reactions);

          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => !isDeleted && setHoveredMessage(msg._id)}
              onMouseLeave={() => {
                setHoveredMessage(null);
              }}
            >
              <div className="relative flex items-end gap-1 max-w-xs">

                {/* Action buttons */}
                {hoveredMessage === msg._id && !isDeleted && (
                  <div className={`flex items-center gap-1 mb-2 ${isOwn ? 'order-first' : 'order-last'}`}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(
                            showEmojiPicker === msg._id ? null : msg._id
                          );
                        }}
                        className="text-gray-400 hover:text-yellow-500 text-sm transition"
                        title="React"
                      >
                        😊
                      </button>

                      {/* Emoji picker popup */}
                      {showEmojiPicker === msg._id && (
                        <div
                          className={`absolute bottom-8 bg-white rounded-full shadow-lg border border-gray-200 flex gap-1 px-2 py-1 z-50 ${
                            isOwn ? 'right-0' : 'left-0'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg._id, emoji)}
                              className="text-lg hover:scale-125 transition-transform"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleReply(msg)}
                      className="text-gray-400 hover:text-blue-500 text-sm transition"
                      title="Reply"
                    >
                      ↩️
                    </button>

                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="text-gray-400 hover:text-red-500 text-sm transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col">
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm ${
                      isDeleted
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 italic'
                        : isOwn
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow rounded-bl-none'
                    }`}
                  >
                    {/* Reply preview */}
                    {!isDeleted && msg.replyTo && (
                      <div className={`text-xs px-2 py-1 rounded-lg mb-2 border-l-2 ${
                        isOwn
                          ? 'bg-blue-500 border-blue-300 text-blue-100'
                          : 'bg-gray-100 border-gray-400 text-gray-500'
                      }`}>
                        <p className="font-semibold">{msg.replyTo.sender?.name || 'Unknown'}</p>
                        <p className="truncate">
                          {msg.replyTo.isDeleted ? 'This message was deleted' : msg.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Attachment */}
                    {!isDeleted && msg.attachments?.length > 0 && (
                      <img
                        src={msg.attachments[0]}
                        alt="attachment"
                        className="rounded-lg max-w-full mb-1 cursor-pointer"
                        onClick={() => window.open(msg.attachments[0], '_blank')}
                      />
                    )}

                    {/* Content */}
                    {msg.content}

                    {/* Timestamp + ticks */}
                    {!isDeleted && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        isOwn ? 'justify-end text-blue-200' : 'text-gray-400'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isOwn && (
                          <span>
                            {isRead
                              ? <span className="text-blue-300 font-bold">✓✓</span>
                              : <span className="text-blue-200">✓</span>
                            }
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Reactions display */}
                  {Object.keys(groupedReactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(groupedReactions).map(([emoji, users]) => {
                        const hasReacted = msg.reactions?.some(
                          (r) => r.emoji === emoji && r.userId === user.id
                        );
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg._id, emoji)}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition ${
                              hasReacted
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            title={users.join(', ')}
                          >
                            {emoji} {users.length}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-2xl text-sm text-gray-500 dark:text-gray-300 shadow">
              {otherUser?.name} is typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="bg-blue-50 dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-blue-500 rounded" />
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Replying to {getSenderName(replyingTo)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 truncate max-w-xs">
                {replyingTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelReply}
            className="text-gray-400 hover:text-gray-600 text-lg ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white dark:bg-gray-900 p-4 flex gap-3 items-center shadow">
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
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
          className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
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