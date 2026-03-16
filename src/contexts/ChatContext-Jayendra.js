import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uploadMessageToIPFS, getMessageFromIPFS, isIPFSConfigured } from '../utils/ipfs';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // Mock chat rooms data
  const [chatRooms, setChatRooms] = useState([
    {
      id: '1',
      name: 'DeChat Genesis Holders',
      description: 'Exclusive chat for DeChat Genesis NFT holders',
      requiredNFT: 'DeChat Genesis',
      memberCount: 127,
      hasAccess: true,
      isActive: true
    },
    {
      id: '2',
      name: 'CryptoPunks Lounge',
      description: 'Chat room for CryptoPunks collectors',
      requiredNFT: 'CryptoPunks',
      memberCount: 89,
      hasAccess: true,
      isActive: false
    },
    {
      id: '3',
      name: 'BAYC Exclusive',
      description: 'Bored Ape Yacht Club members only',
      requiredNFT: 'Bored Ape Yacht Club',
      memberCount: 234,
      hasAccess: false,
      isActive: false
    }
  ]);

  // Mock messages for rooms
  const [messages, setMessages] = useState({
    '1': [
      {
        id: '1',
        sender: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8E9',
        content: 'Welcome to the DeChat Genesis holders room!',
        timestamp: new Date(Date.now() - 3600000),
        ipfsHash: 'QmX1Y2Z3...',
        canMint: true
      },
      {
        id: '2',
        sender: '0x123456789abcdef123456789abcdef123456789a',
        content: 'Great to be here! Love the NFT-gated concept.',
        timestamp: new Date(Date.now() - 1800000),
        ipfsHash: 'QmA1B2C3...',
        canMint: false
      }
    ],
    '2': [
      {
        id: '3',
        sender: '0x987654321fedcba987654321fedcba987654321f',
        content: 'CryptoPunks forever! 🤖',
        timestamp: new Date(Date.now() - 7200000),
        ipfsHash: 'QmD4E5F6...',
        canMint: false
      }
    ]
  });

  // Private chats - load from localStorage
  const [privateChats, setPrivateChats] = useState(() => {
    const saved = localStorage.getItem('privateChats');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      return parsed.map(chat => ({
        ...chat,
        timestamp: new Date(chat.timestamp)
      }));
    }
    return [];
  });

  const [privateMessages, setPrivateMessages] = useState(() => {
    const saved = localStorage.getItem('privateMessages');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      Object.keys(parsed).forEach(chatId => {
        parsed[chatId] = parsed[chatId].map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      });
      return parsed;
    }
    return {};
  });
  
  // Store IPFS hashes for each chat to track messages
  const [chatIPFSHashes, setChatIPFSHashes] = useState(() => {
    const saved = localStorage.getItem('chatIPFSHashes');
    return saved ? JSON.parse(saved) : {};
  });

  // Track minted messages
  const [mintedMessages, setMintedMessages] = useState([
    {
      id: '1',
      content: 'Welcome to the DeChat Genesis holders room!',
      tokenId: '001',
      mintDate: new Date(Date.now() - 86400000),
      room: 'DeChat Genesis Holders',
      transactionHash: '0xmock123...'
    },
    {
      id: '2',
      content: 'This platform is revolutionary!',
      tokenId: '002',
      mintDate: new Date(Date.now() - 172800000),
      room: 'CryptoPunks Lounge',
      transactionHash: '0xmock456...'
    }
  ]);

  const sendMessage = (roomId, content) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8E9',
      content,
      timestamp: new Date(),
      ipfsHash: `QmMock${Date.now()}...`,
      canMint: true
    };

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage]
    }));
  };

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('privateChats', JSON.stringify(privateChats));
  }, [privateChats]);

  useEffect(() => {
    localStorage.setItem('privateMessages', JSON.stringify(privateMessages));
  }, [privateMessages]);

  useEffect(() => {
    localStorage.setItem('chatIPFSHashes', JSON.stringify(chatIPFSHashes));
  }, [chatIPFSHashes]);

  // Poll for new messages from IPFS
  useEffect(() => {
    if (privateChats.length === 0) {
      return; // Don't poll if no chats
    }

    const pollInterval = setInterval(() => {
      // Poll each active chat for new messages
      privateChats.forEach(chat => {
        loadMessagesFromIPFS(chat.id);
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [privateChats]);

  // Load messages from IPFS for a specific chat
  const loadMessagesFromIPFS = async (chatId) => {
    try {
      // Fetch hashes from API server
      const response = await fetch(`http://localhost:3002/api/chats/${chatId}/hashes`);
      const data = await response.json();
      const serverHashes = data.hashes || [];
      
      // Merge with local hashes
      let hashes = [...new Set([...(chatIPFSHashes[chatId] || []), ...serverHashes])];
      
      // Update state if we found new hashes
      if (hashes.length > (chatIPFSHashes[chatId] || []).length) {
        setChatIPFSHashes(prev => ({
          ...prev,
          [chatId]: hashes
        }));
      }
      
      // Load any new hashes we haven't loaded yet
      const currentMessages = privateMessages[chatId] || [];
      const loadedHashes = currentMessages.map(m => m.ipfsHash).filter(Boolean);
      const newHashes = hashes.filter(h => !loadedHashes.includes(h));
      
      if (newHashes.length > 0) {
        console.log(`📥 Loading ${newHashes.length} new messages from IPFS for chat ${chatId}`);
        
        for (const hash of newHashes) {
          try {
            const messageData = await getMessageFromIPFS(hash);
            const message = {
              ...messageData,
              timestamp: new Date(messageData.timestamp),
              ipfsHash: hash
            };
            
            setPrivateMessages(prev => {
              const existingMessages = prev[chatId] || [];
              // Check if message already exists by ID or IPFS hash
              const exists = existingMessages.some(m => 
                m.id === message.id || m.ipfsHash === hash
              );
              
              if (exists) {
                console.log('⚠️ Message already exists, skipping:', message.id);
                return prev;
              }
              
              return {
                ...prev,
                [chatId]: [...existingMessages, message]
              };
            });
            
            // Update last message in chat list
            setPrivateChats(prev => prev.map(chat =>
              chat.id === chatId
                ? { ...chat, lastMessage: message.content, timestamp: message.timestamp }
                : chat
            ));
          } catch (error) {
            console.error('Failed to load message from IPFS:', hash, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch hashes from server:', error);
      // Fallback to localStorage if server is down
      const savedHashes = localStorage.getItem(`chat_hashes_${chatId}`);
      if (savedHashes) {
        const hashes = JSON.parse(savedHashes);
        setChatIPFSHashes(prev => ({
          ...prev,
          [chatId]: hashes
        }));
      }
    }
  };

  const createPrivateChat = (participantAddress, currentUserAddress) => {
    // Check if chat already exists
    const existingChat = privateChats.find(
      chat => chat.participant.toLowerCase() === participantAddress.toLowerCase()
    );

    if (existingChat) {
      // Load messages from IPFS
      loadMessagesFromIPFS(existingChat.id);
      return existingChat;
    }

    // Create consistent chat ID by sorting addresses
    // This ensures both users get the same chat ID regardless of who creates it first
    const addresses = [currentUserAddress.toLowerCase(), participantAddress.toLowerCase()].sort();
    const chatId = `chat-${addresses[0]}-${addresses[1]}`;
    
    const newChat = {
      id: chatId,
      participant: participantAddress,
      lastMessage: 'Start a conversation...',
      timestamp: new Date(),
      unreadCount: 0
    };

    setPrivateChats(prev => [...prev, newChat]);

    // Initialize empty messages and IPFS hashes for the new chat
    setPrivateMessages(prev => ({
      ...prev,
      [newChat.id]: []
    }));
    
    setChatIPFSHashes(prev => ({
      ...prev,
      [chatId]: []
    }));

    // Load any existing messages from IPFS
    loadMessagesFromIPFS(chatId);

    return newChat;
  };

  const sendPrivateMessage = async (chatId, content, currentUserAddress) => {
    const timestamp = new Date();
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sender: currentUserAddress,
      content,
      timestamp: timestamp,
      ipfsHash: null,
      uploading: true
    };

    console.log('📤 Sending message to IPFS:', { chatId, content, sender: currentUserAddress });

    // Add message to UI immediately (optimistic update)
    setPrivateMessages(prev => {
      const existingMessages = prev[chatId] || [];
      // Check if message already exists
      const exists = existingMessages.some(m => m.id === newMessage.id);
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        [chatId]: [...existingMessages, newMessage]
      };
    });

    // Upload to IPFS
    try {
      let ipfsHash;
      
      if (isIPFSConfigured()) {
        const messageForIPFS = {
          id: newMessage.id,
          sender: currentUserAddress,
          content: content,
          timestamp: timestamp.toISOString(),
          chatId: chatId
        };
        
        ipfsHash = await uploadMessageToIPFS(messageForIPFS);
        console.log('✅ Message uploaded to IPFS:', ipfsHash);
      } else {
        console.warn('⚠️ IPFS not configured. Using mock hash.');
        await new Promise(resolve => setTimeout(resolve, 500));
        ipfsHash = `QmMock${Date.now()}${Math.random().toString(36).substring(7)}`;
      }
      
      // Update message with IPFS hash
      setPrivateMessages(prev => {
        const chatMessages = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMessages.map(msg =>
            msg.id === newMessage.id
              ? { ...msg, ipfsHash, uploading: false }
              : msg
          )
        };
      });
      
      // Store the IPFS hash for this chat
      setChatIPFSHashes(prev => {
        const newHashes = {
          ...prev,
          [chatId]: [...(prev[chatId] || []), ipfsHash]
        };
        
        // Save to localStorage as backup
        localStorage.setItem(`chat_hashes_${chatId}`, JSON.stringify(newHashes[chatId]));
        
        return newHashes;
      });
      
      // Send hash to API server for cross-browser/cross-computer sharing
      try {
        await fetch(`http://localhost:3002/api/chats/${chatId}/hashes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ipfsHash })
        });
        console.log('✅ Hash saved to server');
      } catch (error) {
        console.error('⚠️ Failed to save hash to server:', error);
        // Continue anyway, localStorage backup exists
      }
      
      // Update last message in chat list
      setPrivateChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, lastMessage: content, timestamp: timestamp }
          : chat
      ));

      return { success: true, ipfsHash };
    } catch (error) {
      console.error('❌ Failed to upload to IPFS:', error);
      
      // Mark message as failed
      setPrivateMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId].map(msg =>
          msg.id === newMessage.id
            ? { ...msg, uploading: false, failed: true, error: error.message }
            : msg
        )
      }));

      return { success: false, error: error.message };
    }
  };

  const mintMessageAsNFT = async (messageId, roomId) => {
    // Mock minting process
    console.log(`Minting message ${messageId} from room ${roomId} as NFT...`);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      success: true,
      transactionHash: `0xmock${Date.now()}`,
      tokenId: Math.floor(Math.random() * 10000)
    };

    // Find the message and room details
    const roomMessages = messages[roomId] || [];
    const message = roomMessages.find(msg => msg.id === messageId);
    const room = chatRooms.find(r => r.id === roomId);

    if (message && room) {
      // Add to minted messages
      const newMintedMessage = {
        id: messageId,
        content: message.content,
        tokenId: result.tokenId.toString(),
        mintDate: new Date(),
        room: room.name,
        transactionHash: result.transactionHash
      };

      setMintedMessages(prev => [...prev, newMintedMessage]);
    }

    return result;
  };

  const createRoom = (roomData) => {
    const newRoom = {
      id: Date.now().toString(),
      name: roomData.name,
      description: roomData.description,
      type: roomData.type || 'public', // 'public' or 'private'
      requiredNFT: roomData.requiredNFT,
      nftContractAddress: roomData.nftContractAddress || null,
      nftOption: roomData.nftOption || null, // 'new' or 'existing'
      existingNFTId: roomData.existingNFTId || null, // Reference to existing NFT
      memberCount: 1,
      hasAccess: true, // Creator always has access
      isActive: true,
      createdBy: roomData.createdBy,
      createdAt: new Date(),
      mintPrice: roomData.mintPrice || null,
      maxSupply: roomData.maxSupply || null
    };

    setChatRooms(prev => [...prev, newRoom]);

    // Initialize empty messages for the new room
    setMessages(prev => ({
      ...prev,
      [newRoom.id]: []
    }));

    return newRoom;
  };

  const deleteRoom = (roomId) => {
    // Remove room from chat rooms
    setChatRooms(prev => prev.filter(room => room.id !== roomId));

    // Remove all messages from the room
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[roomId];
      return newMessages;
    });
  };

  const removeMintedMessage = (messageId) => {
    setMintedMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const leaveRoom = (roomId) => {
    // Remove user's access to the room and decrease member count
    setChatRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          hasAccess: false,
          memberCount: Math.max(0, room.memberCount - 1)
        };
      }
      return room;
    }));
  };

  const deletePrivateMessage = (chatId, messageId, deleteType = 'forMe') => {
    // Only local deletion is supported with IPFS (messages are immutable on IPFS)
    setPrivateMessages(prev => {
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: chatMessages.map(msg =>
          msg.id === messageId ? { ...msg, deletedForMe: true } : msg
        )
      };
    });
  };

  const value = {
    chatRooms,
    messages,
    privateChats,
    privateMessages,
    mintedMessages,
    sendMessage,
    sendPrivateMessage,
    createPrivateChat,
    mintMessageAsNFT,
    createRoom,
    deleteRoom,
    removeMintedMessage,
    leaveRoom,
    deletePrivateMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};