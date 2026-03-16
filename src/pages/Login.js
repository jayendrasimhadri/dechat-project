import React from 'react';
// REAL METAMASK: Using real MetaMask wallet
import { useWallet } from '../contexts/WalletContext';
import { Wallet, MessageSquare, Shield, Zap } from 'lucide-react';

const Login = () => {
  const { connectWallet, isConnecting, error, networkError, switchToSepolia } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to DeChat</h1>
          <p className="text-gray-600">
            Decentralized real-time chat with NFT-gated rooms
          </p>
        </div>

        <div className="card mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 text-sm">
              Connect your MetaMask wallet to access NFT-gated chat rooms
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {networkError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm font-medium mb-2">{networkError}</p>
              <button
                onClick={switchToSepolia}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Switch to Sepolia Testnet
              </button>
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

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <Shield className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="font-medium text-gray-900">NFT-Gated Access</h3>
              <p className="text-sm text-gray-600">Exclusive rooms for NFT holders</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <Zap className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="font-medium text-gray-900">Real-time Chat</h3>
              <p className="text-sm text-gray-600">Instant messaging on blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;