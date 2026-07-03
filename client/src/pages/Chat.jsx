import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import useSocket from '../hooks/useSocket';
import useOnlineStatus from '../hooks/useOnlineStatus';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const token = localStorage.getItem('accessToken');
  const socket = useSocket(token);
  const { isOnline } = useOnlineStatus(socket);

  return (
    <div className="flex h-screen">
      <Sidebar
        onSelectConversation={setSelectedConversation}
        selectedId={selectedConversation?._id}
        isOnline={isOnline}
        socket={socket}
      />
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            socket={socket}
            isOnline={isOnline}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full bg-gray-100">
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-lg font-semibold">Select a conversation to start chatting</p>
              <p className="text-sm mt-2">Search for a user in the sidebar to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}