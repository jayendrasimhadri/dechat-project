import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useChat } from '../contexts/ChatContext';
import {
  MessageCircle, Send, Plus, User, X, Loader,
  Search, MoreVertical, Trash2, CheckCircle
} from 'lucide-react';

// Simple double-check icon
const CheckCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 7l-8 8-4-4" /><path d="M22 7l-8 8" />
  </svg>
);

const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
const formatTime = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const PrivateChats = () => {
  const { chats, activeChatId, createPrivateChat, sendPrivateMessage, deletePrivateMessage, setWallet, isLoading, contactsLoading } = useChat();
  const { account, isConnected } = useWallet();
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [modalError, setModalError] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isConnected && account) setWallet(account);
  }, [isConnected, account, setWallet]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, chats]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleCreateChat = () => {
    setModalError('');
    const result = createPrivateChat(newChatAddress, account);
    if (!result.success) { setModalError(result.error); return; }
    setShowNewChatModal(false);
    setNewChatAddress('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await sendPrivateMessage(text);
      showToast('Message sent', 'success');
    } catch {
      showToast('Failed to send', 'error');
      setNewMessage(text);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeMsgs = (activeChat?.messages || []).filter(m => !m.deletedForMe);

  const getOther = (chat) => {
    if (!chat || !account) return '';
    return chat.participants.find(p => p.toLowerCase() !== account.toLowerCase()) || '';
  };

  const isOwn = (sender) => sender?.toLowerCase() === account?.toLowerCase();

  const handleLongPress = (id) => {
    const t = setTimeout(() => setShowDeleteMenu(id), 500);
    setLongPressTimer(t);
  };
  const handlePressEnd = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
  };

  const filteredChats = chats.filter(c => {
    const other = getOther(c);
    return !search || other.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Private Chats</h2>
            <button onClick={() => setShowNewChatModal(true)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by address..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-6 flex flex-col items-center justify-center text-gray-400">
              <Loader className="w-5 h-5 animate-spin mb-2" />
              <p className="text-xs">Loading contacts...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Click + to start a new chat</p>
            </div>
          ) : filteredChats.map((chat) => {
            const other = getOther(chat);
            const last = chat.messages[chat.messages.length - 1];
            return (
              <div key={chat.id} onClick={() => createPrivateChat(other, account)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeChatId === chat.id ? 'bg-primary-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{formatAddress(other)}</p>
                    {last && (
                      <p className="text-xs text-gray-500 truncate">
                        {last.deletedForEveryone ? 'Message deleted' : last.content}
                      </p>
                    )}
                  </div>
                  {last && <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(last.timestamp)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChatId && activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{formatAddress(getOther(activeChat))}</p>
                <p className="text-xs text-gray-500">Private conversation on Sepolia</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {activeMsgs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : activeMsgs.map((msg) => (
                <div key={msg.id} className={`flex ${isOwn(msg.sender) ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative group max-w-xs lg:max-w-md">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.deletedForEveryone ? 'bg-gray-200 text-gray-500 italic'
                          : isOwn(msg.sender) ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                      onMouseDown={() => isOwn(msg.sender) && !msg.deletedForEveryone && handleLongPress(msg.id)}
                      onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
                      onTouchStart={() => isOwn(msg.sender) && !msg.deletedForEveryone && handleLongPress(msg.id)}
                      onTouchEnd={handlePressEnd}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn(msg.sender) ? 'text-primary-200' : 'text-gray-400'}`}>
                        {formatTime(msg.timestamp)}
                        {isOwn(msg.sender) && <CheckCheck className="w-3 h-3 ml-1 inline" />}
                      </p>
                    </div>

                    {showDeleteMenu === msg.id && isOwn(msg.sender) && (
                      <div className="absolute top-0 right-0 mt-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-44">
                        <button onClick={() => { deletePrivateMessage(msg.id, 'forMe'); setShowDeleteMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                          <Trash2 className="w-4 h-4" /><span>Delete for Me</span>
                        </button>
                        <button onClick={() => { deletePrivateMessage(msg.id, 'forEveryone'); setShowDeleteMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                          <Trash2 className="w-4 h-4" /><span>Delete for Everyone</span>
                        </button>
                        <button onClick={() => setShowDeleteMenu(null)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 flex items-center space-x-2">
                          <X className="w-4 h-4" /><span>Cancel</span>
                        </button>
                      </div>
                    )}

                    {isOwn(msg.sender) && !msg.deletedForEveryone && (
                      <button onClick={() => setShowDeleteMenu(showDeleteMenu === msg.id ? null : msg.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {showDeleteMenu && <div className="fixed inset-0 z-5" onClick={() => setShowDeleteMenu(null)} />}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..." disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50" />
                <button type="submit" disabled={!newMessage.trim() || isLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <><Loader className="w-4 h-4 animate-spin" /><span>Sending...</span></>
                    : <><Send className="w-4 h-4" /><span>Send</span></>}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a conversation</h3>
              <p className="text-gray-500 text-sm">Choose a chat or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start New Chat</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
              <input type="text" value={newChatAddress}
                onChange={(e) => { setNewChatAddress(e.target.value); setModalError(''); }}
                placeholder="0x..." className="input-field" />
              {modalError && <p className="mt-2 text-sm text-red-600">{modalError}</p>}
            </div>
            <div className="flex space-x-3">
              <button onClick={() => { setShowNewChatModal(false); setNewChatAddress(''); setModalError(''); }}
                className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleCreateChat} className="flex-1 btn-primary">Start Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-5 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateChats;
