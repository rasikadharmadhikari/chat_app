import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

export default function Sidebar({ onSelectConversation, selectedId, isOnline, socket }) {
  const [conversations, setConversations] = useState([]);
  const { user, logout } = useAuth();

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (msg) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === msg.conversationId) {
            const isSelected = conv._id === selectedId;
            return {
              ...conv,
              lastMessage: msg,
              unreadCount: isSelected ? 0 : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        })
      );
    });

    socket.on('messagesRead', ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    });

    return () => {
      socket.off('newMessage');
      socket.off('messagesRead');
    };
  }, [socket, selectedId]);

  const handleSelectConversation = (conv) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conv._id ? { ...c, unreadCount: 0 } : c
      )
    );
    onSelectConversation(conv);
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user.id);
  };

  return (
    <div className="w-72 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-bold">Chats</h2>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-white"
        >
          Logout
        </button>
      </div>

      <div className="p-3 border-b border-gray-700">
        <p className="text-sm text-gray-400">Logged in as</p>
        <p className="text-sm font-semibold">{user.name}</p>
      </div>

      <SearchBar onStartConversation={handleSelectConversation} />

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">No conversations yet.</p>
        ) : (
          conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isSelected = conv._id === selectedId;
            const online = isOnline(other?._id);
            const unread = conv.unreadCount || 0;

            return (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-700 transition ${
                  isSelected ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {other?.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        other?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      online ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${unread > 0 ? 'font-bold text-white' : 'font-semibold'}`}>
                      {other?.name}
                    </p>
                    <p className={`text-xs truncate ${unread > 0 ? 'text-white' : 'text-gray-400'}`}>
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>

                  {unread > 0 && (
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}