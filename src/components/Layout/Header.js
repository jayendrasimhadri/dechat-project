import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { LogOut, Wallet, Bell, AlertCircle } from 'lucide-react';

const Header = () => {
  const { walletAddress, disconnectWallet, networkError, switchToSepolia, chainId } = useWallet();

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainIdHex) => {
    const chainIdMap = {
      '0xaa36a7': 'Sepolia',
      '0x7a69': 'Hardhat',
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0xa': 'Optimism',
      '0xa4b1': 'Arbitrum',
    };
    return chainIdMap[chainIdHex] || 'Unknown';
  };

  const isSepoliaNetwork = chainId === '0xaa36a7' || chainId === '0x7a69';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome to DeChat
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {networkError && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">Wrong Network</span>
              <button
                onClick={switchToSepolia}
                className="ml-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors"
              >
                Switch
              </button>
            </div>
          )}

          {!networkError && chainId && (
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isSepoliaNetwork 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isSepoliaNetwork ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className={`text-xs font-medium ${
                isSepoliaNetwork ? 'text-green-700' : 'text-gray-600'
              }`}>
                {getNetworkName(chainId)}
              </span>
            </div>
          )}

          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
            <Wallet className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(walletAddress)}
            </span>
          </div>

          <button
            onClick={disconnectWallet}
            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;