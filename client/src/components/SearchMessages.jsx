import { useState, useRef } from 'react';
import api from '../services/api';

export default function SearchMessages({ conversationId, onSelectMessage, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = conversationId
          ? `/messages/search?query=${value}&conversationId=${conversationId}`
          : `/messages/search?query=${value}`;

        const res = await api.get(params);
        setResults(res.data);
        setSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder={conversationId ? 'Search in this chat...' : 'Search all messages...'}
            className="flex-1 outline-none text-sm dark:bg-transparent dark:text-white placeholder-gray-400"
            autoFocus
          />
          {loading && <span className="text-gray-400 text-xs">Searching...</span>}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && searched && !loading && (
            <div className="p-8 text-center">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No messages found for "{query}"
              </p>
            </div>
          )}

          {!searched && !loading && (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">
                Type at least 2 characters to search
              </p>
            </div>
          )}

          {results.map((msg) => (
            <div
              key={msg._id}
              onClick={() => onSelectMessage && onSelectMessage(msg)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                  {msg.sender?.avatar ? (
                    <img src={msg.sender.avatar} alt={msg.sender.name} className="w-full h-full object-cover" />
                  ) : (
                    msg.sender?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold dark:text-white">
                      {msg.sender?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {highlightText(msg.content, query)}
                  </p>
                  {!conversationId && msg.conversationId?.isGroup && (
                    <p className="text-xs text-purple-500 mt-1">
                      👥 {msg.conversationId.groupName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}