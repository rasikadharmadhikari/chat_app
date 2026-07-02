import axios from 'axios';

const PRODUCTION_URL = 'https://chat-app-server-ka0j.onrender.com/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || PRODUCTION_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;