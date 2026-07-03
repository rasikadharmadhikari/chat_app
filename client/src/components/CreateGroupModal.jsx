import { useState } from 'react';
import api from '../services/api';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get(`/users/search?query=${value}`);
      setSearchResults(
        res.data.filter(
          (u) => !selectedUsers.find((s) => s._id === u._id)
        )
      );
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleAddUser = (user) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length < 2) {
      setError('Add at least 2 members');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/conversations', {
        isGroup: true,
        groupName: groupName.trim(),
        participants: selectedUsers.map((u) => u._id),
      });
      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Create Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Search users to add..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg mt-1 max-h-32 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleAddUser(user)}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">
              Members ({selectedUsers.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                >
                  {user.name}
                  <button
                    onClick={() => handleRemoveUser(user._id)}
                    className="text-blue-400 hover:text-blue-700 ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>

      </div>
    </div>
  );
}