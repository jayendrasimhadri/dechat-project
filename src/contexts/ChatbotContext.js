import React, { createContext, useContext, useState } from 'react';

const ChatbotContext = createContext();

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m DeChat Assistant. I can help you create rooms, mint NFTs, browse the marketplace, and more! What would you like to do?',
      timestamp: new Date(),
      options: [
        { id: 'create-room', text: 'Create a new room', action: 'create-room' },
        { id: 'mint-nft', text: 'Mint room access NFT', action: 'mint-nft' },
        { id: 'browse-marketplace', text: 'Browse marketplace', action: 'browse-marketplace' },
        { id: 'join-room', text: 'Join a room', action: 'join-room' }
      ]
    }
  ]);

  const [currentFlow, setCurrentFlow] = useState(null);
  const [flowData, setFlowData] = useState({});

  const flows = {
    'create-room': {
      steps: [
        {
          id: 'room-type',
          message: 'What type of room would you like to create?',
          options: [
            { id: 'public', text: 'Public Room (Anyone can join)', value: 'public' },
            { id: 'private', text: 'Private Room (NFT required)', value: 'private' }
          ]
        },
        {
          id: 'room-name',
          message: 'What would you like to name your room?',
          input: 'text',
          placeholder: 'Enter room name...'
        },
        {
          id: 'room-description',
          message: 'Please provide a description for your room:',
          input: 'textarea',
          placeholder: 'Describe your room...'
        }
      ]
    },
    'mint-nft': {
      steps: [
        {
          id: 'select-room',
          message: 'Which room would you like to create access NFTs for?',
          type: 'room-select'
        },
        {
          id: 'nft-details',
          message: 'Let\'s set up your NFT details:',
          fields: [
            { name: 'nftName', label: 'NFT Name', type: 'text', placeholder: 'e.g., VIP Access Pass' },
            { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'e.g., VAP' },
            { name: 'totalSupply', label: 'Total Supply', type: 'number', placeholder: '100' },
            { name: 'mintPrice', label: 'Price (ETH)', type: 'number', placeholder: '0.1' }
          ]
        }
      ]
    },
    'browse-marketplace': {
      steps: [
        {
          id: 'marketplace-intro',
          message: 'Here are the available room access NFTs in our marketplace. You can purchase these to gain access to exclusive rooms!',
          type: 'marketplace-display'
        }
      ]
    },
    'join-room': {
      steps: [
        {
          id: 'room-selection',
          message: 'I can help you join a room! First, let me show you available rooms:',
          type: 'room-list'
        }
      ]
    }
  };

  const addMessage = (message) => {
    const newMessage = {
      id: Date.now().toString(),
      ...message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content) => {
    addMessage({
      type: 'user',
      content
    });
  };

  const addBotMessage = (content, options = null) => {
    addMessage({
      type: 'bot',
      content,
      options
    });
  };

  const startFlow = (flowId) => {
    setCurrentFlow(flowId);
    setFlowData({});
    
    const flow = flows[flowId];
    if (flow && flow.steps.length > 0) {
      const firstStep = flow.steps[0];
      addBotMessage(firstStep.message, firstStep.options);
    }
  };

  const handleUserInput = (input, stepId = null) => {
    addUserMessage(input);

    if (currentFlow) {
      const flow = flows[currentFlow];
      const currentStepIndex = flow.steps.findIndex(step => step.id === stepId);
      
      // Store the input
      setFlowData(prev => ({
        ...prev,
        [stepId]: input
      }));

      // Move to next step or complete flow
      if (currentStepIndex < flow.steps.length - 1) {
        const nextStep = flow.steps[currentStepIndex + 1];
        setTimeout(() => {
          addBotMessage(nextStep.message, nextStep.options);
        }, 1000);
      } else {
        // Flow completed
        setTimeout(() => {
          completeFlow();
        }, 1000);
      }
    }
  };

  const completeFlow = () => {
    switch (currentFlow) {
      case 'create-room':
        addBotMessage(
          `Perfect! I've gathered all the information needed to create your ${flowData['room-type']} room "${flowData['room-name']}". You can now proceed to create it from the dashboard!`,
          [
            { id: 'create-another', text: 'Create another room', action: 'create-room' },
            { id: 'main-menu', text: 'Back to main menu', action: 'main-menu' }
          ]
        );
        break;
      case 'mint-nft':
        addBotMessage(
          'Great! Your NFT minting details are ready. You can now proceed to mint your room access NFTs from the room management section!',
          [
            { id: 'mint-another', text: 'Mint for another room', action: 'mint-nft' },
            { id: 'main-menu', text: 'Back to main menu', action: 'main-menu' }
          ]
        );
        break;
      default:
        addBotMessage(
          'How else can I help you today?',
          [
            { id: 'create-room', text: 'Create a new room', action: 'create-room' },
            { id: 'mint-nft', text: 'Mint room access NFT', action: 'mint-nft' },
            { id: 'browse-marketplace', text: 'Browse marketplace', action: 'browse-marketplace' }
          ]
        );
    }
    
    setCurrentFlow(null);
    setFlowData({});
  };

  const handleOptionClick = (option) => {
    if (option.action === 'main-menu') {
      setCurrentFlow(null);
      setFlowData({});
      addBotMessage(
        'How can I help you today?',
        [
          { id: 'create-room', text: 'Create a new room', action: 'create-room' },
          { id: 'mint-nft', text: 'Mint room access NFT', action: 'mint-nft' },
          { id: 'browse-marketplace', text: 'Browse marketplace', action: 'browse-marketplace' },
          { id: 'join-room', text: 'Join a room', action: 'join-room' }
        ]
      );
    } else if (flows[option.action]) {
      startFlow(option.action);
    } else {
      handleUserInput(option.text, option.id);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const value = {
    isOpen,
    messages,
    currentFlow,
    flowData,
    toggleChatbot,
    addUserMessage,
    addBotMessage,
    handleOptionClick,
    handleUserInput,
    startFlow
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export default ChatbotProvider;