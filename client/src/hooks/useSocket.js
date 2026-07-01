import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

const useSocket = (token) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        auth: { token },
      });
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