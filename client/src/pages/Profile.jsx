import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        setName(res.data.name);
        setEmail(res.data.email);
        setAvatar(res.data.avatar);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/profile/me', { name });
      localStorage.setItem('user', JSON.stringify({
        ...user,
        name: res.data.name,
      }));
      setMessage('Name updated successfully!');
    } catch (err) {
      setError('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.put('/profile/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(res.data.avatar);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        avatar: res.data.avatar,
      }));
      setMessage('Avatar updated successfully!');
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <button
            onClick={() => navigate('/chat')}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Chat
          </button>
        </div>

        {message && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Avatar section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                name?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-blue-700">
              {avatarLoading ? '...' : '📷'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Click the camera to change photo
          </p>
        </div>

        {/* Name section */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 block mb-1">
            Display Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={handleUpdateName}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Email section (read only) */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-600 block mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Account info */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-3">Account</p>
          <button
            onClick={logout}
            className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-semibold hover:bg-red-100"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}