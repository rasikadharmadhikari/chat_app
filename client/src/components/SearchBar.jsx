import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export default function SearchBar({ onStartConversation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?query=${value}`);
        setResults(res.data);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelectUser = async (user) => {
    try {
      const res = await api.post('/conversations', {
        participantId: user._id,
        isGroup: false,
      });
      onStartConversation(res.data, true);
      setQuery('');
      setResults([]);
      setShowResults(false);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  return (
    <div ref={searchRef} className="relative px-3 py-2">
      <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 gap-2">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search users..."
          className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-400"
        />
        {loading && <span className="text-gray-400 text-xs">...</span>}
      </div>

      {showResults && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-700">
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm p-3 text-center">No users found</p>
          ) : (
            results.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer transition"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{user.name}</p>
                  <p className="text-gray-400 text-xs">{user.email}</p>
                </div>
                <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                  user.status === 'online' ? 'bg-green-400' : 'bg-gray-500'
                }`} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}