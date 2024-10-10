import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, X, AlertCircle } from 'lucide-react';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const socket = io(BACKEND_URL);

function App() {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('message', (message: string) => {
      setMessages(prevMessages => [...prevMessages, { text: message, sender: 'ai' }]);
    });

    socket.on('error', (error: string) => {
      console.error('Error:', error);
      setError(error);
    });

    return () => {
      socket.off('message');
      socket.off('error');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages(prevMessages => [...prevMessages, { text: input, sender: 'user' }]);
      socket.emit('sendMessage', input);
      setInput('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('File upload failed');
        }
        const data = await response.json();
        console.log('File uploaded:', data.fileId);
        setMessages(prevMessages => [...prevMessages, { text: `File "${file.name}" uploaded successfully.`, sender: 'ai' }]);
      } catch (error) {
        console.error('Error uploading file:', error);
        setError('Failed to upload file. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <AlertCircle onClick={() => setError(null)} className="fill-current h-6 w-6 text-red-500" />
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send size={20} />
          </button>
          <label className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer">
            <Upload size={20} />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
          {file && (
            <div className="flex items-center bg-gray-200 rounded-lg p-2">
              <span className="text-sm truncate max-w-xs">{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;