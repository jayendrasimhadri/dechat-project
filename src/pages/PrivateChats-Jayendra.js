import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  MessageCircle, 
  Send, 
  Plus,
  Search,
  User,
  MapPin,
  Globe,
  Twitter,
  X,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

const PrivateChats = () => {
  const { privateChats, privateMessages, sendPrivateMessage, createPrivateChat, deletePrivateMessage } = useChat();
  const { walletAddress } = useWallet();
  const [selectedChat, setSelectedChat] = useState(privateChats[0]?.id || null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const messagesEndRef = React.useRef(null);

  // User profiles can be fetched from a backend or blockchain in the future
  const userProfiles = {};

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const safeFormatDate = (timestamp, formatStr) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return format(date, formatStr);
    } catch (error) {
      return 'Just now';
    }
  };

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      console.log('📤 Sending message from UI:', newMessage.trim());
      const result = await sendPrivateMessage(selectedChat, newMessage.trim(), walletAddress);
      console.log('📤 Send result:', result);
      setNewMessage('');
    }
  };

  const handleCreateNewChat = () => {
    if (!newChatAddress.trim()) {
      alert('Please enter a valid wallet address');
      return;
    }

    // Basic validation for Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newChatAddress.trim())) {
      alert('Invalid Ethereum address format');
      return;
    }

    // Check if trying to chat with self
    if (newChatAddress.toLowerCase() === walletAddress.toLowerCase()) {
      alert('You cannot start a chat with yourself');
      return;
    }

    const newChat = createPrivateChat(newChatAddress.trim(), walletAddress);
    setSelectedChat(newChat.id);
    setShowNewChatModal(false);
    setNewChatAddress('');
  };

  const selectedChatMessages = selectedChat ? privateMessages[selectedChat] || [] : [];
  const selectedChatInfo = privateChats.find(chat => chat.id === selectedChat);
  const selectedUserProfile = selectedChatInfo ? userProfiles[selectedChatInfo.participant] : null;

  const isOwnMessage = (sender) => sender === walletAddress;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Selected chat:', selectedChat);
    console.log('🔍 Messages for this chat:', selectedChatMessages.length);
    console.log('🔍 All private messages:', privateMessages);
  }, [selectedChat, selectedChatMessages, privateMessages]);

  // Auto-scroll when messages change
  React.useEffect(() => {
    if (selectedChatMessages.length > 0) {
      scrollToBottom();
    }
  }, [selectedChatMessages]);

  const handleLongPress = (messageId) => {
    const timer = setTimeout(() => {
      setShowDeleteMenu(messageId);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDeleteMessage = (messageId, deleteType) => {
    deletePrivateMessage(selectedChat, messageId, deleteType);
    setShowDeleteMenu(null);
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Private Chats</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {privateChats.map((chat) => {
            const profile = userProfiles[chat.participant];
            return (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                  selectedChat === chat.id ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {profile?.displayName || formatAddress(chat.participant)}
                      </h3>
                      {chat.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {safeFormatDate(chat.timestamp, 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedUserProfile?.avatar ? (
                    <img 
                      src={selectedUserProfile.avatar} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedUserProfile?.displayName || formatAddress(selectedChatInfo?.participant)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedUserProfile?.bio ? selectedUserProfile.bio.slice(0, 50) + '...' : 'Private conversation'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowProfile(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedChatMessages
                .filter(message => !message.deletedForMe) // Hide messages deleted for current user
                .map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage(message.sender) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="relative group">
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.deletedForEveryone
                          ? 'bg-gray-200 text-gray-500 italic'
                          : isOwnMessage(message.sender)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                      onMouseDown={() => isOwnMessage(message.sender) && !message.deletedForEveryone && handleLongPress(message.id)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      onTouchStart={() => isOwnMessage(message.sender) && !message.deletedForEveryone && handleLongPress(message.id)}
                      onTouchEnd={handlePressEnd}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          message.deletedForEveryone
                            ? 'text-gray-400'
                            : isOwnMessage(message.sender) ? 'text-primary-200' : 'text-gray-500'
                        }`}>
                          {safeFormatDate(message.timestamp, 'HH:mm')}
                        </p>
                        {message.uploading && (
                          <span className="text-xs text-primary-200 ml-2">Uploading to IPFS...</span>
                        )}
                        {message.failed && (
                          <span className="text-xs text-red-300 ml-2">Failed</span>
                        )}
                        {message.ipfsHash && !message.uploading && (
                          <span className="text-xs text-primary-200 ml-2" title={message.ipfsHash}>✓ IPFS</span>
                        )}
                      </div>
                    </div>

                    {/* Delete Menu */}
                    {showDeleteMenu === message.id && isOwnMessage(message.sender) && (
                      <div className="absolute top-0 right-0 mt-2 mr-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        <button
                          onClick={() => handleDeleteMessage(message.id, 'forMe')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete for Me</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id, 'forEveryone')}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete for Everyone</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteMenu(null)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}

                    {/* Delete menu trigger for own messages */}
                    {isOwnMessage(message.sender) && !message.deletedForEveryone && (
                      <button
                        onClick={() => setShowDeleteMenu(showDeleteMenu === message.id ? null : message.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity duration-200"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Click outside to close delete menu */}
            {showDeleteMenu && (
              <div 
                className="fixed inset-0 z-5" 
                onClick={() => setShowDeleteMenu(null)}
              />
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 input-field"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Start New Chat
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={newChatAddress}
                onChange={(e) => setNewChatAddress(e.target.value)}
                placeholder="0x..."
                className="input-field"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewChat}
                className="flex-1 btn-primary"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && selectedUserProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              {selectedUserProfile.avatar ? (
                <img 
                  src={selectedUserProfile.avatar} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
              )}
              <h4 className="text-xl font-semibold text-gray-900 mb-1">
                {selectedUserProfile.displayName}
              </h4>
              <p className="text-sm text-gray-500 mb-2">
                {formatAddress(selectedChatInfo?.participant)}
              </p>
              {selectedUserProfile.bio && (
                <p className="text-gray-600 text-sm">{selectedUserProfile.bio}</p>
              )}
            </div>

            <div className="space-y-3">
              {selectedUserProfile.location && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedUserProfile.location}</span>
                </div>
              )}
              
              {selectedUserProfile.website && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={selectedUserProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {selectedUserProfile.website}
                  </a>
                </div>
              )}
              
              {selectedUserProfile.twitter && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Twitter className="w-4 h-4" />
                  <a 
                    href={`https://twitter.com/${selectedUserProfile.twitter.replace('@', '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {selectedUserProfile.twitter}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowProfile(false)}
                className="w-full btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateChats;