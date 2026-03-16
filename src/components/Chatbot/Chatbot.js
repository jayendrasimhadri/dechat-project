import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../contexts/ChatbotContext';
import { useChat } from '../../contexts/ChatContext';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot,
  User,
  Minimize2,
  Maximize2
} from 'lucide-react';

const Chatbot = () => {
  const { 
    isOpen, 
    messages, 
    toggleChatbot, 
    handleOptionClick, 
    addUserMessage 
  } = useChatbot();
  // Removed NFTContext - marketplace data should come from blockchain if needed
  const { chatRooms } = useChat();
  
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addUserMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === 'marketplace-display') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Visit the Marketplace page to browse and purchase NFTs!
          </p>
          <p className="text-xs text-gray-500">
            All NFTs are fetched directly from the blockchain.
          </p>
        </div>
      );
    }

    if (message.type === 'room-list') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Available rooms:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {chatRooms.slice(0, 4).map((room) => (
              <div key={room.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-gray-600">{room.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {room.requiredNFT ? `Requires: ${room.requiredNFT}` : 'Public room'}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${room.hasAccess ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-sm text-gray-700">{message.content}</p>;
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transition-all duration-200 ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">DeChat Assistant</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-primary-700 rounded"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleChatbot}
            className="p-1 hover:bg-primary-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-64">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs ${
                  message.type === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      {renderMessageContent(message)}
                      
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleOptionClick(option)}
                              className="block w-full text-left px-3 py-2 bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors duration-200 text-sm"
                            >
                              {option.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;