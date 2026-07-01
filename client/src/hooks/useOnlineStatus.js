import { useEffect, useState } from 'react';

const useOnlineStatus = (socket) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('userOnline', (userId) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    socket.on('userOffline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  return { onlineUsers, isOnline };
};

export default useOnlineStatus;