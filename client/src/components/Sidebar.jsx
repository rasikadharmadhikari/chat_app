import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar({
  onSelectConversation,
  selectedId,
  isOnline,
  socket,
}) {
  const [conversations, setConversations] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const { user, logout } = useAuth();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (msg) => {
      setConversations((prev) => {
        const exists = prev.find(
          (c) => c._id === msg.conversationId
        );

        if (!exists) {
          fetchConversations();
          return prev;
        }

        return prev.map((conv) => {
          if (conv._id === msg.conversationId) {
            const isSelected =
              conv._id === selectedId;

            return {
              ...conv,
              lastMessage: msg,
              unreadCount: isSelected
                ? 0
                : (conv.unreadCount || 0) + 1,
            };
          }

          return conv;
        });
      });
    });

    socket.on(
      'messagesRead',
      ({ conversationId }) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  unreadCount: 0,
                }
              : conv
          )
        );
      }
    );

    return () => {
      socket.off('newMessage');
      socket.off('messagesRead');
    };
  }, [socket, selectedId, fetchConversations]);

  const handleSelectConversation = (
    conv,
    isNew = false
  ) => {
    if (isNew) {
      setConversations((prev) => {
        const exists = prev.find(
          (c) => c._id === conv._id
        );

        if (!exists) {
          return [
            { ...conv, unreadCount: 0 },
            ...prev,
          ];
        }

        return prev;
      });
    }

    setConversations((prev) =>
      prev.map((c) =>
        c._id === conv._id
          ? {
              ...c,
              unreadCount: 0,
            }
          : c
      )
    );

    onSelectConversation(conv);
  };

  // Supports both personal chats and groups
  const getConversationDisplay = (conv) => {
    if (conv.isGroup) {
      return {
        name: conv.groupName,
        avatar: null,
        isGroup: true,
      };
    }

    const other = conv.participants.find(
      (p) => p._id !== user.id
    );

    return {
      name: other?.name,
      avatar: other?.avatar,
      isGroup: false,
      otherUser: other,
    };
  };

  return (
    <>
      <div className="w-72 bg-gray-900 text-white h-screen flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            Chats
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setShowGroupModal(true)
              }
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg"
            >
              + Group
            </button>

            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Logged in user */}
        <div className="p-3 border-b border-gray-700">
          <p className="text-sm text-gray-400">
            Logged in as
          </p>

          <p className="text-sm font-semibold">
            {user.name}
          </p>
        </div>

        {/* Search */}
        <SearchBar
          onStartConversation={
            handleSelectConversation
          }
        />

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-sm">
                No conversations yet.
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Search for a user to start
                chatting!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const display =
                getConversationDisplay(conv);

              const isSelected =
                conv._id === selectedId;

              const online =
                !display.isGroup &&
                isOnline(
                  display.otherUser?._id
                );

              const unread =
                conv.unreadCount || 0;
                              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-700 transition ${
                    isSelected ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">

                    {/* Avatar / Group Icon */}
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          display.isGroup
                            ? 'bg-purple-500 text-lg'
                            : 'bg-blue-500'
                        }`}
                      >
                        {display.isGroup ? (
                          '👥'
                        ) : display.avatar ? (
                          <img
                            src={display.avatar}
                            alt={display.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          display.name?.charAt(0).toUpperCase()
                        )}
                      </div>

                      {!display.isGroup && (
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                            online
                              ? 'bg-green-400'
                              : 'bg-gray-500'
                          }`}
                        />
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p
                          className={`text-sm ${
                            unread > 0
                              ? 'font-bold text-white'
                              : 'font-semibold'
                          }`}
                        >
                          {display.name}
                        </p>

                        {display.isGroup && (
                          <span className="text-xs text-purple-400">
                            Group
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs truncate ${
                          unread > 0
                            ? 'text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {conv.lastMessage?.content ||
                          'No messages yet'}
                      </p>
                    </div>

                    {/* Unread Count */}
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

      {/* Create Group Modal */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(conv) => {
            setConversations((prev) => [
              { ...conv, unreadCount: 0 },
              ...prev,
            ]);

            handleSelectConversation(conv, true);

            setShowGroupModal(false);
          }}
        />
      )}
    </>
  );
}