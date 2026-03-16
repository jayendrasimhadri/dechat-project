
import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  // User profile data
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    bio: '',
    avatar: '',
    location: '',
    website: '',
    twitter: ''
  });

  // Mock NFTs owned by user
  const [ownedNFTs] = useState([
    {
      id: '1',
      name: 'DeChat Genesis',
      collection: 'DeChat Official',
      tokenId: '001',
      image: 'https://via.placeholder.com/150/3b82f6/ffffff?text=NFT1'
    },
    {
      id: '2',
      name: 'Crypto Punk #1234',
      collection: 'CryptoPunks',
      tokenId: '1234',
      image: 'https://via.placeholder.com/150/ef4444/ffffff?text=NFT2'
    }
  ]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not detected. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Get the first account
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      
      console.log('Connected to MetaMask:', address);
    } catch (err) {
      console.error('MetaMask connection error:', err);
      
      // Handle specific error cases
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection request in MetaMask.');
      } else if (err.code === -32002) {
        setError('Connection request already pending. Please check MetaMask.');
      } else {
        setError(err.message || 'Failed to connect to MetaMask.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setError('');
  };

  const updateProfile = (profileData) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            console.log('Already connected to:', accounts[0]);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          // User switched to a different account
          setWalletAddress(accounts[0]);
          console.log('Account changed to:', accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        // Reload the page when chain changes (recommended by MetaMask)
        console.log('Chain changed to:', chainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [walletAddress]);

  const value = {
    isConnected,
    walletAddress,
    isConnecting,
    error,
    ownedNFTs,
    userProfile,
    connectWallet,
    disconnectWallet,
    updateProfile
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};