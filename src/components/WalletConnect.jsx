/**
 * WalletConnect Component
 * 
 * Reusable wallet connection component that:
 * - Connects to MetaMask
 * - Displays connected wallet address
 * - Shows network status (Sepolia)
 * - Allows network switching
 * - Shows disconnect option
 */

import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';

const WalletConnect = ({ showNetworkStatus = true, showDisconnect = true, compact = false }) => {
  const {
    account,
    isConnected,
    isConnecting,
    error,
    networkError,
    chainId,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    formatAddress
  } = useWallet();

  const isSepoliaNetwork = chainId === '0xaa36a7';

  const getNetworkName = (chainIdHex) => {
    const chainIdMap = {
      '0xaa36a7': 'Sepolia',
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0xa': 'Optimism',
      '0xa4b1': 'Arbitrum',
    };
    return chainIdMap[chainIdHex] || 'Unknown';
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
        >
          <Wallet className="w-5 h-5" />
          <span>
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </span>
        </button>
      </div>
    );
  }

  // Connected state - Compact version
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {networkError && (
          <button
            onClick={switchToSepolia}
            className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded text-xs transition-colors"
            title={networkError}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Switch Network</span>
          </button>
        )}
        
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
          <Wallet className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {formatAddress(account)}
          </span>
        </div>

        {showDisconnect && (
          <button
            onClick={disconnectWallet}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Disconnect Wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Connected state - Full version
  return (
    <div className="space-y-3">
      {/* Network Status */}
      {showNetworkStatus && (
        <div>
          {networkError ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-yellow-800 text-sm font-medium">{networkError}</p>
              </div>
              <button
                onClick={switchToSepolia}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Switch to Sepolia Testnet
              </button>
            </div>
          ) : (
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${
              isSepoliaNetwork 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isSepoliaNetwork ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Network</p>
                <p className={`text-sm font-medium ${
                  isSepoliaNetwork ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {getNetworkName(chainId)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wallet Address */}
      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <Wallet className="w-5 h-5 text-gray-600" />
        <div className="flex-1">
          <p className="text-xs text-gray-600">Connected Wallet</p>
          <p className="text-sm font-medium text-gray-900 font-mono">
            {formatAddress(account)}
          </p>
        </div>
      </div>

      {/* Disconnect Button */}
      {showDisconnect && (
        <button
          onClick={disconnectWallet}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Disconnect Wallet</span>
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
