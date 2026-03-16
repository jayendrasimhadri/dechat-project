import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isAddress, getAddress } from 'ethers';
import { getContract, getContractReadOnly, getPrivateContacts } from '../utils/contract';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const eventListenerRef = useRef(null);

  // ─── Load contacts from contract's privateContacts mapping ─────────────────
  // The new contract stores contacts on-chain via sendPrivateMessage.
  // getPrivateContacts(address) returns both sides automatically.
  const loadContactsFromChain = async (walletAddress) => {
    if (!walletAddress) return;
    setContactsLoading(true);
    try {
      const contacts = await getPrivateContacts(walletAddress);
      if (!contacts.length) return;

      const normalizedMe = getAddress(walletAddress);
      const myAddr = walletAddress.toLowerCase();

      const newChats = contacts.map(contactAddr => {
        const normalizedContact = getAddress(contactAddr);
        const chatId = [myAddr, contactAddr.toLowerCase()].sort().join('_');
        return { id: chatId, participants: [normalizedMe, normalizedContact], messages: [] };
      });

      setChats(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const toAdd = newChats.filter(c => !existingIds.has(c.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });

      console.log(`✅ Loaded ${contacts.length} contacts from contract for`, walletAddress);
    } catch (err) {
      console.warn('⚠️ Could not load contacts from contract:', err.message);
    } finally {
      setContactsLoading(false);
    }
  };

  // Fetch contacts whenever wallet connects or changes
  useEffect(() => {
    if (connectedWallet) loadContactsFromChain(connectedWallet);
  }, [connectedWallet]);

  /**
   * Load persisted messages from blockchain on wallet connect or chat open
   */
  const loadPrivateMessages = async (chatId, participants) => {
    if (!chatId || !participants || participants.length < 2) return;
    try {
      const contract = await getContractReadOnly();
      const [user1, user2] = participants;
      const rawMsgs = await contract.getPrivateMessages(user1, user2);

      const msgs = rawMsgs.map((msg, i) => ({
        id: `chain_${i}_${msg.timestamp}`,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(Number(msg.timestamp) * 1000).toISOString()
      }));

      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId ? { ...chat, messages: msgs } : chat
        )
      );
      console.log('✅ Loaded', msgs.length, 'messages from blockchain for', chatId);
    } catch (err) {
      console.warn('⚠️ Could not load private messages from blockchain:', err.message);
    }
  };

  /**
   * Set up PrivateMessageSent event listener for real-time updates
   */
  useEffect(() => {
    if (!connectedWallet) return;

    const setupListener = async () => {
      try {
        const contract = await getContractReadOnly();

        const listener = (from, to, content, timestamp) => {
          const fromAddr = from.toLowerCase();
          const toAddr = to.toLowerCase();
          const myAddr = connectedWallet.toLowerCase();

          // Only process messages involving current wallet
          if (fromAddr !== myAddr && toAddr !== myAddr) return;

          const chatId = [fromAddr, toAddr].sort().join('_');

          const newMsg = {
            id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            sender: from,
            content,
            timestamp: new Date(Number(timestamp) * 1000).toISOString()
          };

          setChats(prev => {
            const existingChat = prev.find(c => c.id === chatId);

            // Skip if sender is current user (already added optimistically)
            if (fromAddr === myAddr) return prev;

            if (!existingChat) {
              // Auto-create chat and add contact if receiving a new message
              loadContactsFromChain(connectedWallet); // refresh contact list
              return [...prev, {
                id: chatId,
                participants: [from, to],
                messages: [newMsg]
              }];
            }

            // Avoid duplicates by content+timestamp
            const exists = existingChat.messages.some(
              m => m.content === content &&
                   Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 2000
            );
            if (exists) return prev;

            return prev.map(chat =>
              chat.id === chatId
                ? { ...chat, messages: [...chat.messages, newMsg] }
                : chat
            );
          });
        };

        contract.on('PrivateMessageSent', listener);
        eventListenerRef.current = { contract, listener };
        console.log('✅ PrivateMessageSent listener active');
      } catch (err) {
        console.warn('⚠️ Could not set up PrivateMessageSent listener:', err.message);
      }
    };

    setupListener();

    return () => {
      if (eventListenerRef.current) {
        const { contract, listener } = eventListenerRef.current;
        try { contract.off('PrivateMessageSent', listener); } catch (_) {}
        eventListenerRef.current = null;
      }
    };
  }, [connectedWallet]);

  /**
   * Load messages from blockchain when active chat changes
   */
  useEffect(() => {
    if (!activeChatId) return;
    const chat = chats.find(c => c.id === activeChatId);
    if (chat && chat.messages.length === 0) {
      loadPrivateMessages(activeChatId, chat.participants);
    }
  }, [activeChatId]);

  const setWallet = (walletAddress) => {
    setConnectedWallet(walletAddress);
  };

  const createPrivateChat = (targetWalletAddress, currentAccount) => {
    if (!currentAccount) return { success: false, error: 'Wallet not connected' };
    if (!targetWalletAddress?.trim()) return { success: false, error: 'Please enter a wallet address' };

    const trimmedAddress = targetWalletAddress.trim();
    if (!isAddress(trimmedAddress)) return { success: false, error: 'Invalid Ethereum address' };

    const normalizedTarget = getAddress(trimmedAddress);
    const normalizedCurrent = getAddress(currentAccount);

    if (normalizedTarget === normalizedCurrent) return { success: false, error: 'You cannot chat with yourself' };

    const chatId = [normalizedCurrent.toLowerCase(), normalizedTarget.toLowerCase()].sort().join('_');

    const existingChat = chats.find(chat => chat.id === chatId);
    if (existingChat) {
      setActiveChatId(chatId);
      return { success: true, chatId, isNew: false };
    }

    const newChat = { id: chatId, participants: [normalizedCurrent, normalizedTarget], messages: [] };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(chatId);

    // Load history from blockchain
    loadPrivateMessages(chatId, [normalizedCurrent, normalizedTarget]);

    return { success: true, chatId, isNew: true };
  };

  const sendPrivateMessage = async (text) => {
    if (!activeChatId || !connectedWallet) return;
    if (!text.trim()) return;

    const activeChat = chats.find(chat => chat.id === activeChatId);
    if (!activeChat) return;

    const receiver = activeChat.participants.find(
      p => p.toLowerCase() !== connectedWallet.toLowerCase()
    );

    setIsLoading(true);

    try {
      const contract = await getContract();
      const tx = await contract.sendPrivateMessage(receiver, text.trim());
      await tx.wait();

      // Optimistic UI update
      const message = {
        id: `msg_${Date.now()}`,
        sender: connectedWallet,
        receiver,
        content: text.trim(),
        timestamp: new Date().toISOString()
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, message] }
            : chat
        )
      );
    } catch (err) {
      console.error('❌ Send message error:', err);
      if (err.code !== 'ACTION_REJECTED' && err.code !== 4001) {
        alert('Failed to send message: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrivateMessage = (messageId, deleteType) => {
    if (!activeChatId) return;
    setChats(prev =>
      prev.map(chat => {
        if (chat.id !== activeChatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id !== messageId) return msg;
            if (deleteType === 'forMe') return { ...msg, deletedForMe: true };
            if (deleteType === 'forEveryone') return { ...msg, deletedForEveryone: true, content: 'This message was deleted' };
            return msg;
          })
        };
      })
    );
  };

  const getActiveChat = () => chats.find(chat => chat.id === activeChatId);

  const privateMessages = chats.reduce((acc, chat) => {
    acc[chat.id] = chat.messages;
    return acc;
  }, {});

  const value = {
    privateChats: chats,
    privateMessages,
    chats,
    activeChatId,
    isLoading,
    contactsLoading,   // true while fetching contacts on wallet connect
    mintedMessages: [],
    sendPrivateMessage,
    deletePrivateMessage,
    createPrivateChat,
    getActiveChat,
    removeMintedMessage: () => {},
    setWallet
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
