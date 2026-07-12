import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ForwardMessageModal({ message, onClose, onForwarded }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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

  const toggleSelect = (convId) => {
    setSelected((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
    );
  };

  const handleForward = async () => {
    if (selected.length === 0) return;
    setLoading(true);

    try {
      await Promise.all(
        selected.map((conversationId) =>
          api.post('/messages', {
            conversationId,
            content: `↪ Forwarded: ${message.content}`,
            attachments: message.attachments || [],
          })
        )
      );
      setDone(true);
      setTimeout(() => {
        onForwarded();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Forward failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg dark:text-white">Forward Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Message preview */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 mx-4 mt-3 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Message to forward:</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
            {message.content}
          </p>
        </div>

        {/* Conversation list */}
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3">
            Select chats to forward to:
          </p>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
            {conversations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No conversations found
              </p>
            )}
            {conversations.map((conv) => {
              const isGroup = conv.isGroup;
              const name = isGroup
                ? conv.groupName
                : conv.participants.find(
                    (p) => p._id !== conv.participants[0]?._id
                  )?.name || 'Unknown';
              const isSelected = selected.includes(conv._id);

              return (
                <div
                  key={conv._id}
                  onClick={() => toggleSelect(conv._id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    isGroup ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {isGroup ? '👥' : name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-white truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selected.length === 0 || loading || done}
            className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {done ? '✅ Forwarded!' : loading ? 'Forwarding...' : `Forward${selected.length > 0 ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}