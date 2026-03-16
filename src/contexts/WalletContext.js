/**
 * Real MetaMask Wallet Context
 * 
 * Provides MetaMask authentication without requiring smart contract deployment.
 * Uses ethers.js for wallet connection and address validation.
 * 
 * Features:
 * - Real MetaMask connection via window.ethereum
 * - Wallet address persistence in localStorage
 * - Account and network change detection
 * - Clean architecture for future smart contract integration
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { switchToHardhatLocal, switchToSepolia, isHardhatContract } from '../utils/contract';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [ownedNFTs] = useState([]); // For future NFT integration
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    bio: '',
    avatar: ''
  });

  // Supported chain IDs
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
  const HARDHAT_CHAIN_ID = '0x7a69';   // 31337

  /**
   * Check if MetaMask is installed
   */
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window.ethereum !== 'undefined';
  }, []);

  /**
   * Initialize provider
   */
  const initializeProvider = useCallback(() => {
    if (isMetaMaskInstalled()) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      return ethersProvider;
    }
    return null;
  }, [isMetaMaskInstalled]);

  /**
   * Check if on Sepolia network
   */
  const isSepoliaNetwork = useCallback((chainIdHex) => {
    return chainIdHex === SEPOLIA_CHAIN_ID || chainIdHex === HARDHAT_CHAIN_ID;
  }, [SEPOLIA_CHAIN_ID, HARDHAT_CHAIN_ID]);

  /**
   * Switch to Sepolia network
   */
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetworkError(null);
      return true;
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          setNetworkError(null);
          return true;
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          setNetworkError('Failed to add Sepolia network. Please add it manually.');
          return false;
        }
      }
      console.error('Failed to switch network:', err);
      setNetworkError('Failed to switch to Sepolia network.');
      return false;
    }
  };

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = async () => {
    setError(null);
    setNetworkError(null);
    setIsConnecting(true);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];
      
      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Auto-switch to correct network
      try {
        if (isHardhatContract()) {
          if (chainIdHex !== HARDHAT_CHAIN_ID) await switchToHardhatLocal();
        } else {
          if (chainIdHex !== SEPOLIA_CHAIN_ID) await switchToSepolia();
        }
      } catch (_) { /* user may dismiss — non-fatal */ }

      const finalChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!isSepoliaNetwork(finalChainId)) {
        setNetworkError('Please switch to Sepolia or Hardhat Local network to use DeChat.');
        console.warn('⚠️ Not on correct network. Current chain ID:', finalChainId);
      }

      // Initialize provider
      initializeProvider();

      // Update state
      setAccount(address);
      setChainId(finalChainId);
      setIsConnected(true);

      // Persist to localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('isWalletConnected', 'true');

      console.log('✅ Wallet connected:', address);
      console.log('🔗 Chain ID:', chainIdHex);

      return address;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      setIsConnected(false);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setProvider(null);
    setNetworkError(null);
    
    // Clear localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isWalletConnected');

    console.log('🔌 Wallet disconnected');
  };

  /**
   * Get wallet balance
   */
  const getBalance = async () => {
    if (!provider || !account) {
      return '0';
    }

    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Failed to get balance:', err);
      return '0';
    }
  };

  /**
   * Switch network
   */
  const switchNetwork = async (chainIdHex) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (err) {
      console.error('Failed to switch network:', err);
      throw err;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = (newProfile) => {
    setUserProfile(prev => ({ ...prev, ...newProfile }));
    // Persist to localStorage
    localStorage.setItem(`userProfile_${account}`, JSON.stringify({ ...userProfile, ...newProfile }));
    console.log('✅ Profile updated');
  };

  /**
   * Load user profile from localStorage
   */
  useEffect(() => {
    if (account) {
      const savedProfile = localStorage.getItem(`userProfile_${account}`);
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (err) {
          console.error('Failed to load profile:', err);
        }
      }
    }
  }, [account]);

  /**
   * Auto-connect on mount if previously connected
   */
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('isWalletConnected');
      const savedAddress = localStorage.getItem('walletAddress');

      if (wasConnected === 'true' && savedAddress && isMetaMaskInstalled()) {
        try {
          // Check if account is still accessible
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });

          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            // Silently reconnect
            const chainIdHex = await window.ethereum.request({
              method: 'eth_chainId'
            });

            // Auto-switch to correct network based on contract address
            try {
              if (isHardhatContract()) {
                if (chainIdHex !== HARDHAT_CHAIN_ID) await switchToHardhatLocal();
              } else {
                if (chainIdHex !== SEPOLIA_CHAIN_ID) await switchToSepolia();
              }
            } catch (_) { /* user may dismiss — non-fatal */ }

            const finalChainId = await window.ethereum.request({ method: 'eth_chainId' });

            initializeProvider();
            setAccount(accounts[0]);
            setChainId(finalChainId);
            setIsConnected(true);

            // Check network
            if (!isSepoliaNetwork(finalChainId)) {
              setNetworkError('Please switch to Sepolia or Hardhat Local network to use DeChat.');
            }

            console.log('🔄 Auto-connected to wallet:', accounts[0]);
          } else {
            // Clear stale data
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('isWalletConnected');
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('isWalletConnected');
        }
      }
    };

    autoConnect();
  }, [isMetaMaskInstalled, initializeProvider, isSepoliaNetwork]);

  /**
   * Listen for account changes
   */
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
        console.log('👋 MetaMask disconnected');
      } else if (accounts[0] !== account) {
        // User switched account
        setAccount(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
        console.log('🔄 Account changed to:', accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [account, isMetaMaskInstalled]);

  /**
   * Listen for chain changes
   */
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      console.log('🔗 Network changed to:', newChainId);
      
      // Check if on Sepolia
      if (!isSepoliaNetwork(newChainId)) {
        setNetworkError('Please switch to Sepolia or Hardhat Local network to use DeChat.');
      } else {
        setNetworkError(null);
      }
      
      // Reload page on network change (recommended by MetaMask)
      window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled, isSepoliaNetwork]);

  const value = {
    // State
    account,
    walletAddress: account, // Alias for compatibility
    chainId,
    isConnected,
    isConnecting,
    error,
    networkError,
    provider,
    ownedNFTs,
    userProfile,

    // Functions
    connectWallet,
    disconnectWallet,
    getBalance,
    switchNetwork,
    switchToSepolia,
    isMetaMaskInstalled,
    isSepoliaNetwork,
    updateProfile,

    // Utility
    formatAddress: (address) => {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

/**
 * Get checksum address
 */
export const getChecksumAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch {
    return null;
  }
};
