import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

export default function Sidebar({ onSelectConversation, selectedId, isOnline }) {
  const [conversations, setConversations] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
    fetchConversations();
  }, []);

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

      <SearchBar onStartConversation={onSelectConversation} />

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">No conversations yet.</p>
        ) : (
          conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isSelected = conv._id === selectedId;
            const online = isOnline(other?._id);

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
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
                    {/* Real-time green dot */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                      online ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{other?.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>

                  <p className={`text-xs flex-shrink-0 ${
                    online ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {online ? 'online' : 'offline'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}