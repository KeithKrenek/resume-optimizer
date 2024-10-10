import React, { useState } from 'react';
import App from './App';
import { MessageCircle } from 'lucide-react';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4">
      {isOpen ? (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="flex justify-between items-center bg-blue-500 text-white p-2">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              &times;
            </button>
          </div>
          <div className="h-[calc(100%-40px)]">
            <App />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;