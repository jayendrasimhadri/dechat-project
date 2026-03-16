/**
 * MyNFTs Component - Blockchain-Only Version
 * 
 * Displays NFTs owned by the connected wallet.
 * Allows users to list their NFTs for sale.
 * Fetches data directly from blockchain.
 */

import React, { useState, useEffect } from 'react';
import { getContract, getContractReadOnly } from '../utils/contract';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import {
  Tag,
  Loader,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  DollarSign
} from 'lucide-react';

const MyNFTs = ({ onListNFT }) => {
  const { walletAddress } = useWallet();
  
  // State management
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch NFTs owned by connected wallet
   */
  const fetchMyNFTs = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🖼️ Fetching NFTs for wallet:', walletAddress);

      // Get contract instance (read-only)
      const contract = await getContractReadOnly();

      // Try to fetch NFTs by owner
      let ownedNFTs = [];

      // Method 1: Try getNFTsByOwner if available
      if (typeof contract.getNFTsByOwner === 'function') {
        ownedNFTs = await contract.getNFTsByOwner(walletAddress);
        console.log('📊 NFTs from getNFTsByOwner:', ownedNFTs?.length || 0);
      } 
      // Method 2: Try getOwnedNFTs if available
      else if (typeof contract.getOwnedNFTs === 'function') {
        const tokenIds = await contract.getOwnedNFTs(walletAddress);
        console.log('📊 Token IDs from getOwnedNFTs:', tokenIds?.length || 0);
        
        // Fetch details for each token
        ownedNFTs = await Promise.all(
          (tokenIds || []).map(async (tokenId) => {
            try {
              const nft = await contract.getNFT(tokenId);
              return nft;
            } catch (err) {
              console.warn(`Failed to fetch NFT #${tokenId}:`, err);
              return null;
            }
          })
        );
        ownedNFTs = ownedNFTs.filter(nft => nft !== null);
      }
      // Method 3: Fallback - filter all NFTs
      else {
        console.log('⚠️ Using fallback method - fetching all NFTs and filtering');
        const allNFTs = await contract.getAllListedNFTs();
        ownedNFTs = (allNFTs || []).filter(
          nft => nft?.owner?.toLowerCase() === walletAddress.toLowerCase()
        );
      }

      // Transform data for display - convert BigInt to Number
      const nftsData = (ownedNFTs || []).map((nft) => ({
        tokenId: Number(nft?.tokenId || 0),
        owner: nft?.owner || '',
        name: nft?.name || `NFT #${nft?.tokenId}`,
        metadataURI: nft?.metadataURI || '',
        price: nft?.price?.toString() || '0',
        priceInEth: ethers.formatEther(nft?.price || 0),
        isListed: nft?.isListed || false
      }));

      setMyNFTs(nftsData);
      console.log('✅ Fetched and processed owned NFTs:', nftsData.length);
    } catch (err) {
      console.error('❌ Failed to fetch owned NFTs:', err);
      setError(err?.message || 'Failed to load your NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch NFTs on mount and when wallet changes
   */
  useEffect(() => {
    fetchMyNFTs();
  }, [walletAddress]);

  /**
   * Not connected state
   */
  if (!walletAddress) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">Please connect your wallet to view your NFTs.</p>
      </div>
    );
  }

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading your NFTs from blockchain...</p>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-medium mb-1">Failed to Load Your NFTs</h3>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button
              onClick={fetchMyNFTs}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (myNFTs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Yet</h3>
        <p className="text-gray-600 mb-4">You don't own any NFTs yet. Mint your first NFT to get started!</p>
        <button
          onClick={fetchMyNFTs}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          My NFTs ({myNFTs.length} {myNFTs.length === 1 ? 'NFT' : 'NFTs'})
        </h2>
        <button
          onClick={fetchMyNFTs}
          disabled={loading}
          className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* NFTs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(myNFTs || []).map((nft) => (
          <div
            key={nft?.tokenId || Math.random()}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* NFT Image Placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
              <ImageIcon className="w-16 h-16 text-white opacity-50" />
              {nft?.isListed && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  Listed
                </div>
              )}
            </div>

            {/* NFT Details */}
            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {nft?.name || `NFT #${nft?.tokenId}`}
                </h3>
                <p className="text-xs text-gray-500">Token ID: #{nft?.tokenId}</p>
              </div>

              {/* Metadata URI */}
              {nft?.metadataURI && (
                <div className="mb-3">
                  <a
                    href={nft.metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 underline truncate block flex items-center space-x-1"
                  >
                    <span>View Metadata</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Listing Status */}
              {nft?.isListed ? (
                <div className="mb-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Listed for Sale</span>
                    <span className="text-sm font-bold text-green-900">
                      {parseFloat(nft?.priceInEth || 0).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Not listed for sale</span>
                </div>
              )}

              {/* List for Sale Button */}
              {!nft?.isListed && onListNFT && (
                <button
                  onClick={() => onListNFT(nft)}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>List for Sale</span>
                </button>
              )}

              {nft?.isListed && (
                <div className="text-center text-sm text-gray-500">
                  Listed on marketplace
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyNFTs;
