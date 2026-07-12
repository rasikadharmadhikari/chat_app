// Profile.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        setName(res.data.name || "");
        setEmail(res.data.email || "");
        setAvatar(res.data.avatar || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err.response?.data || err.message);
        setError("Failed to load profile. Please try again.");
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/profile/me", {
        name: name.trim(),
      });

      const updatedUser = {
        ...user,
        name: res.data.name,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setName(res.data.name);

      setMessage("✅ Name updated successfully!");
    } catch (err) {
      console.error("Update name error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setAvatarLoading(true);
    setMessage("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.put("/profile/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newAvatar = res.data.avatar || "";

      setAvatar(newAvatar);

      const updatedUser = {
        ...user,
        avatar: newAvatar,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setMessage("✅ Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">
            My Profile
          </h1>

          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Chat
          </button>
        </div>

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm p-3 rounded-lg mb-4 border border-green-200 dark:border-green-700">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        {/* Avatar */}
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
                name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>

            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow">
              {avatarLoading ? (
                <span className="text-xs">...</span>
              ) : (
                <span>📷</span>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarLoading}
              />
            </label>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Click 📷 to change profile picture
          </p>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-1">
            Display Name
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleUpdateName()
              }
              className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <button
              onClick={handleUpdateName}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 min-w-16 transition"
            >
              {loading ? "..." : "Save"}
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 cursor-not-allowed"
          />

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Email cannot be changed
          </p>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={logout}
            className="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-700 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition"
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}