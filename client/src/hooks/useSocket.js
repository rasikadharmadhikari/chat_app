import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const PRODUCTION_SOCKET_URL = 'https://chat-app-server-ka0j.onrender.com';

let socketInstance = null;

const useSocket = (token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io(
        import.meta.env.VITE_SOCKET_URL || PRODUCTION_SOCKET_URL,
        { auth: { token } }
      );
    }

    socketRef.current = socketInstance;

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, [token]);

  return socketRef.current;
};

export default useSocket;