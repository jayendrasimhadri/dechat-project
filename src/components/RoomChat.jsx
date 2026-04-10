/**
 * RoomChat Component
 * 
 * Displays messages in a chat room and allows users to send new messages.
 * Uses ethers.js v6 to interact with the DeChat contract.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRoomMessages, sendRoomMessage, joinPublicRoom, joinPrivateRoom, parseContractError, getContractReadOnly } from '../utils/contract';
import { useWallet } from '../contexts/WalletContext';
import { Send, Loader, AlertCircle, MessageSquare, RefreshCw, Lock, LogIn } from 'lucide-react';

const RoomChat = ({ roomId }) => {
  const { account } = useWallet();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [joining, setJoining] = useState(false);
  const messagesEndRef = useRef(null);
  const contractRef = useRef(null);

  /**
   * Format wallet address to short version
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Format timestamp to readable date/time
   */
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Check if message is from current user
   */
  const isMyMessage = (senderAddress) => {
    return account && senderAddress.toLowerCase() === account.toLowerCase();
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Check room access and membership
   */
  const checkRoomAccess = async () => {
    if (!roomId || !account) {
      setCheckingAccess(false);
      return;
    }

    setCheckingAccess(true);
    setError(null);

    try {
      console.log('🔍 Checking room access for:', roomId);

      // Get contract instance (read-only)
      const contract = await getContractReadOnly();

      // Get room info
      const room = await contract.getRoom(roomId);
      const roomData = {
        id: room.id.toString(),
        name: room.name,
        creator: room.creator,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt.toString(),
        exists: room.exists
      };
      setRoomInfo(roomData);

      // Check if user is a member
      const memberStatus = await contract.isMember(roomId, account);
      setIsMember(memberStatus);

      console.log('✅ Room info:', roomData);
      console.log('👤 Is member:', memberStatus);

    } catch (err) {
      console.error('Failed to check room access:', err);
      setError(err.message || 'Failed to check room access.');
    } finally {
      setCheckingAccess(false);
    }
  };

  /**
   * Fetch messages from smart contract
   */
  const fetchMessages = async () => {
    if (!roomId) {
      setError('Room ID is required');
      setLoading(false);
      return;
    }

    // Don't fetch messages if private room and not a member
    if (roomInfo?.isPrivate && !isMember) {
      console.log('⚠️ Cannot fetch messages: Private room and not a member');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📥 Fetching messages for room:', roomId);

      // Use utility which tries signer first (required for onlyMember check)
      const rawMessages = await getRoomMessages(roomId);

      // Transform data for display
      const messagesData = rawMessages.map((msg, index) => ({
        id: index,
        sender: msg.sender,
        content: msg.content,
        timestamp: (new Date(msg.timestamp).getTime() / 1000).toString()
      }));

      setMessages(messagesData);
      console.log('✅ Fetched messages:', messagesData.length);

      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err.message || 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle joining a room
   */
  const handleJoinRoom = async () => {
    if (!roomId || !account) return;

    setJoining(true);
    setError(null);

    try {
      console.log('🚪 Joining room:', roomId);

      if (roomInfo?.isPrivate) {
        await joinPrivateRoom(roomId);
      } else {
        await joinPublicRoom(roomId);
      }

      console.log('✅ Joined room!');

      // Update member status
      setIsMember(true);

      // Fetch messages now that we're a member
      await fetchMessages();

    } catch (err) {
      console.error('Failed to join room:', err);
      const msg = parseContractError(err).message;
      if (msg.toLowerCase().includes('already')) {
        setIsMember(true);
        await fetchMessages();
      } else if (!msg.toLowerCase().includes('rejected')) {
        setError(msg);
      }
    } finally {
      setJoining(false);
    }
  };

  /**
   * Send a new message
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Validate input
    if (!messageText.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!roomId) {
      setError('Room ID is required');
      return;
    }

    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      console.log('📤 Sending message to room:', roomId);

      await sendRoomMessage(roomId, messageText.trim());

      console.log('✅ Message sent!');

      // Add optimistic update then clear input
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: account,
        content: messageText.trim(),
        timestamp: Math.floor(Date.now() / 1000).toString()
      }]);
      setMessageText('');
      setTxHash(null);
      setTimeout(scrollToBottom, 100);

    } catch (err) {
      console.error('Failed to send message:', err);
      const msg = parseContractError(err).message;
      if (!msg.toLowerCase().includes('rejected')) {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle new message event from contract
   */
  const handleMessageEvent = useCallback((eventRoomId, sender, content, timestamp) => {
    try {
      // Check if event is for current room
      const eventRoomIdStr = eventRoomId.toString();
      const currentRoomIdStr = roomId.toString();

      if (eventRoomIdStr === currentRoomIdStr) {
        console.log('📨 New message event received:', {
          roomId: eventRoomIdStr,
          sender,
          content
        });

        // Create new message object
        const newMessage = {
          id: Date.now(), // Use timestamp as temporary ID
          sender: sender,
          content: content,
          timestamp: timestamp.toString()
        };

        // Add message to state (avoid duplicates)
        setMessages((prevMessages) => {
          // Check if message already exists (by content, sender, and timestamp)
          const isDuplicate = prevMessages.some(
            (msg) =>
              msg.sender.toLowerCase() === sender.toLowerCase() &&
              msg.content === content &&
              msg.timestamp === timestamp.toString()
          );

          if (isDuplicate) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prevMessages;
          }

          console.log('✅ Adding new message to state');
          return [...prevMessages, newMessage];
        });

        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Error handling message event:', err);
    }
  }, [roomId]);

  /**
   * Setup event listener for real-time messages
   */
  useEffect(() => {
    let isMounted = true;

    const setupEventListener = async () => {
      if (!roomId || isListening) return;

      try {
        console.log('🎧 Setting up event listener for room:', roomId);

        // Get contract instance (read-only is fine for events)
        const contract = await getContractReadOnly();
        contractRef.current = contract;

        // Listen for MessageSent events
        contract.on('MessageSent', handleMessageEvent);

        if (isMounted) {
          setIsListening(true);
          console.log('✅ Event listener active');
        }
      } catch (err) {
        console.error('Failed to setup event listener:', err);
      }
    };

    setupEventListener();

    // Cleanup function
    return () => {
      isMounted = false;

      if (contractRef.current) {
        console.log('🔇 Removing event listener');
        contractRef.current.off('MessageSent', handleMessageEvent);
        contractRef.current = null;
      }

      setIsListening(false);
    };
  }, [roomId, handleMessageEvent]);

  /**
   * Check room access on component mount and when roomId or account changes
   */
  useEffect(() => {
    checkRoomAccess();
  }, [roomId, account]);

  /**
   * Fetch messages after access check is complete
   */
  useEffect(() => {
    if (!checkingAccess && roomInfo) {
      fetchMessages();
    }
  }, [checkingAccess, roomInfo, isMember]);

  /**
   * Auto-scroll when new messages arrive
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Loading state
   */
  if (checkingAccess || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">
          {checkingAccess ? 'Checking room access...' : 'Loading messages...'}
        </p>
      </div>
    );
  }

  /**
   * Private room - not a member
   */
  if (roomInfo?.isPrivate && !isMember) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{roomInfo.name || `Room #${roomId}`}</h3>
              <p className="text-xs text-orange-600">Private Room</p>
            </div>
          </div>
        </div>

        {/* Private Room Message */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🔒 This is a private room
            </h3>
            <p className="text-gray-600 mb-4">
              Only the room creator can add members to this private room.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Creator:</strong> {formatAddress(roomInfo.creator)}
              </p>
              <p className="text-xs text-orange-600 mt-2">
                Contact the room creator to request access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Public room - not a member (show join button)
   */
  if (!roomInfo?.isPrivate && !isMember) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{roomInfo.name || `Room #${roomId}`}</h3>
              <p className="text-xs text-green-600">Public Room</p>
            </div>
          </div>
        </div>

        {/* Join Room Message */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Join this room to start chatting
            </h3>
            <p className="text-gray-600 mb-6">
              This is a public room. Anyone can join and participate in the conversation.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoinRoom}
              disabled={joining}
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors mx-auto ${
                joining
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {joining ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Join Room</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">
                {roomInfo?.name || `Room #${roomId}`}
              </h3>
              {roomInfo?.isPrivate ? (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Public
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500">{messages.length} messages</p>
              {isListening && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh messages"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Transaction Pending */}
      {sending && txHash && (
        <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-700 text-sm font-medium">Sending message...</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-xs underline"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 text-sm">Be the first to send a message in this room!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isMyMessage(message.sender) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isMyMessage(message.sender)
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {/* Sender */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isMyMessage(message.sender)
                          ? 'text-primary-100'
                          : 'text-gray-600'
                      }`}
                    >
                      {isMyMessage(message.sender) ? 'You' : formatAddress(message.sender)}
                    </span>
                    <span
                      className={`text-xs ${
                        isMyMessage(message.sender)
                          ? 'text-primary-200'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  {/* Message Content */}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              disabled={sending}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {messageText.length}/500 characters • Press Enter to send
            </p>
          </div>
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              sending || !messageText.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomChat;
