import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './SearchBar';
import CreateGroupModal from './CreateGroupModal';
import SearchMessages from './SearchMessages';

export default function Sidebar({ onSelectConversation, selectedId, isOnline, socket }) {
  const [conversations, setConversations] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fetchConversations = useCallback(async (archived = false) => {
    try {
      const res = await api.get(`/conversations?archived=${archived}`);
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations(showArchived);
  }, [fetchConversations, showArchived]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (msg) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === msg.conversationId);
        if (!exists) {
          fetchConversations(showArchived);
          return prev;
        }
        return prev.map((conv) => {
          if (conv._id === msg.conversationId) {
            const isSelected = conv._id === selectedId;
            return {
              ...conv,
              lastMessage: msg,
              unreadCount: isSelected ? 0 : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
      });
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
  }, [socket, selectedId, fetchConversations, showArchived]);

  const handleSelectConversation = (conv, isNew = false) => {
    if (isNew) {
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id);
        if (!exists) return [{ ...conv, unreadCount: 0 }, ...prev];
        return prev;
      });
    }
    setConversations((prev) =>
      prev.map((c) => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
    );
    onSelectConversation(conv);
    setContextMenu(null);
  };

  const handlePin = async (conv, e) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/conversations/${conv._id}/pin`);
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === conv._id ? { ...c, isPinned: res.data.pinned } : c
        );
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
      });
    } catch (err) {
      console.error('Pin failed:', err);
    }
    setContextMenu(null);
  };

  const handleArchive = async (conv, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/conversations/${conv._id}/archive`);
      setConversations((prev) => prev.filter((c) => c._id !== conv._id));
      if (selectedId === conv._id) onSelectConversation(null);
    } catch (err) {
      console.error('Archive failed:', err);
    }
    setContextMenu(null);
  };

  const handleRightClick = (e, conv) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conv,
    });
  };

  const getConversationDisplay = (conv) => {
    if (conv.isGroup) {
      return { name: conv.groupName, avatar: null, isGroup: true };
    }
    const other = conv.participants.find((p) => p._id !== user.id);
    return { name: other?.name, avatar: other?.avatar, isGroup: false, otherUser: other };
  };

  const pinnedConvs = conversations.filter((c) => c.isPinned);
  const unpinnedConvs = conversations.filter((c) => !c.isPinned);

  return (
    <div
      className="w-72 bg-gray-900 dark:bg-gray-950 text-white h-screen flex flex-col relative"
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold">
          {showArchived ? '📦 Archived' : 'Chats'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-lg hover:scale-110 transition-transform"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="text-gray-400 hover:text-white text-lg transition"
            title="Search messages"
          >
            🔍
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
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

      {/* Profile area */}
      <div
        className="p-3 border-b border-gray-700 dark:border-gray-800 flex items-center gap-3 cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-900 transition"
        onClick={() => navigate('/profile')}
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-gray-400">View Profile →</p>
        </div>
      </div>

      {/* Search */}
      <SearchBar onStartConversation={handleSelectConversation} />

      {/* Archive toggle */}
      <button
        onClick={() => setShowArchived((prev) => !prev)}
        className="mx-3 my-2 text-xs text-gray-400 hover:text-white flex items-center gap-2 transition"
      >
        {showArchived ? '← Back to Chats' : '📦 Archived Chats'}
      </button>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-400 text-sm">
              {showArchived ? 'No archived chats.' : 'No conversations yet.'}
            </p>
            {!showArchived && (
              <p className="text-gray-500 text-xs mt-1">Search for a user to start chatting!</p>
            )}
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {!showArchived && pinnedConvs.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 px-4 py-2 uppercase tracking-wider">
                  📌 Pinned
                </p>
                {pinnedConvs.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    conv={conv}
                    isSelected={conv._id === selectedId}
                    user={user}
                    isOnline={isOnline}
                    onSelect={handleSelectConversation}
                    onRightClick={handleRightClick}
                    getDisplay={getConversationDisplay}
                  />
                ))}
                {unpinnedConvs.length > 0 && (
                  <p className="text-xs text-gray-500 px-4 py-2 uppercase tracking-wider">
                    All Chats
                  </p>
                )}
              </div>
            )}

            {/* Regular/unpinned conversations */}
            {unpinnedConvs.map((conv) => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                isSelected={conv._id === selectedId}
                user={user}
                isOnline={isOnline}
                onSelect={handleSelectConversation}
                onRightClick={handleRightClick}
                getDisplay={getConversationDisplay}
              />
            ))}
          </>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1 z-50 min-w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handlePin(contextMenu.conv, e)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
          >
            {contextMenu.conv.isPinned ? '📌 Unpin' : '📌 Pin'}
          </button>
          <button
            onClick={(e) => handleArchive(contextMenu.conv, e)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
          >
            📦 {contextMenu.conv.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      )}

      {/* Modals */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(conv) => {
            setConversations((prev) => [{ ...conv, unreadCount: 0 }, ...prev]);
            handleSelectConversation(conv);
            setShowGroupModal(false);
          }}
        />
      )}

      {showGlobalSearch && (
        <SearchMessages onClose={() => setShowGlobalSearch(false)} />
      )}
    </div>
  );
}

function ConversationItem({ conv, isSelected, user, isOnline, onSelect, onRightClick, getDisplay }) {
  const display = getDisplay(conv);
  const online = !display.isGroup && isOnline(display.otherUser?._id);
  const unread = conv.unreadCount || 0;

  return (
    <div
      onClick={() => onSelect(conv)}
      onContextMenu={(e) => onRightClick(e, conv)}
      className={`p-4 cursor-pointer border-b border-gray-800 dark:border-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 transition ${
        isSelected ? 'bg-gray-700 dark:bg-gray-800' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            display.isGroup ? 'bg-purple-500 text-lg' : 'bg-blue-500'
          }`}>
            {display.isGroup ? '👥' : (
              display.avatar ? (
                <img src={display.avatar} alt={display.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                display.name?.charAt(0).toUpperCase()
              )
            )}
          </div>
          {!display.isGroup && (
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
              online ? 'bg-green-400' : 'bg-gray-500'
            }`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {conv.isPinned && <span className="text-xs">📌</span>}
            <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-white' : 'font-semibold'}`}>
              {display.name}
            </p>
            {display.isGroup && (
              <span className="text-xs text-purple-400 flex-shrink-0">Group</span>
            )}
          </div>
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
}