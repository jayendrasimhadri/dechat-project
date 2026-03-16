/**
 * NFTExample Page
 * 
 * Demonstrates the complete integration of:
 * - MintNFT component
 * - NFTMarketplace component
 * - MyNFTs component
 */

import React, { useState } from 'react';
import MintNFT from '../components/MintNFT';
import NFTMarketplace from '../components/NFTMarketplace';
import MyNFTs from '../components/MyNFTs';
import { Sparkles, ShoppingCart, Image, X } from 'lucide-react';

const NFTExample = () => {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace', 'my-nfts', 'mint'
  const [showMintModal, setShowMintModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handle NFT minted successfully
   */
  const handleNFTMinted = (tokenId) => {
    console.log('NFT minted with ID:', tokenId);
    
    // Refresh all lists
    setRefreshTrigger(prev => prev + 1);
    
    // Close mint modal
    setShowMintModal(false);
    
    // Switch to My NFTs tab
    setActiveTab('my-nfts');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NFT Marketplace</h1>
              <p className="text-gray-600 text-sm">
                Mint, buy, and sell NFTs on the blockchain
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMintModal(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            <span>Mint NFT</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Marketplace</span>
          </button>
          <button
            onClick={() => setActiveTab('my-nfts')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'my-nfts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>My NFTs</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'marketplace' && (
            <NFTMarketplace refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'my-nfts' && (
            <MyNFTs refreshTrigger={refreshTrigger} />
          )}
        </div>
      </div>

      {/* Mint NFT Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900">Mint New NFT</h2>
                </div>
                <button
                  onClick={() => setShowMintModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <MintNFT onNFTMinted={handleNFTMinted} />
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border-t border-blue-200 p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-700 text-sm text-center">
            💡 <strong>Tip:</strong> All NFT operations are recorded on the Sepolia blockchain. 
            Make sure you have test ETH for gas fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NFTExample;
