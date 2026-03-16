/**
 * NFTGallery Component - Blockchain-Only Version
 * 
 * Displays all listed NFTs from the blockchain.
 * Allows users to buy NFTs with MetaMask approval.
 * Listens to NFTMinted, NFTListed, and NFTSold events for real-time updates.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getContract, getContractReadOnly } from '../utils/contract';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import {
  ShoppingCart,
  Loader,
  AlertCircle,
  Tag,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  User
} from 'lucide-react';

const NFTGallery = () => {
  const { walletAddress } = useWallet();
  
  // State management
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingTokenId, setBuyingTokenId] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const eventListenerRef = useRef(null);

  /**
   * Format wallet address to short version
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Check if NFT is owned by current user
   */
  const isMyNFT = (ownerAddress) => {
    return walletAddress && ownerAddress?.toLowerCase() === walletAddress.toLowerCase();
  };

  /**
   * Fetch all listed NFTs from blockchain
   */
  const fetchNFTs = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 Fetching listed NFTs from blockchain...');

      // Get contract instance (read-only)
      const contract = await getContractReadOnly();

      // Fetch all listed NFTs
      const listedNFTs = await contract.getAllListedNFTs();

      console.log('📊 Raw NFTs from blockchain:', listedNFTs?.length || 0);

      // Transform data for display - convert BigInt to Number
      const nftsData = (listedNFTs || [])
        .filter(nft => nft?.isListed) // Only show listed NFTs
        .map((nft) => ({
          tokenId: Number(nft?.tokenId || 0),
          owner: nft?.owner || '',
          name: nft?.name || `NFT #${nft?.tokenId}`,
          metadataURI: nft?.metadataURI || '',
          price: nft?.price?.toString() || '0',
          priceInEth: ethers.formatEther(nft?.price || 0),
          isListed: nft?.isListed || false
        }));

      setNfts(nftsData);
      console.log('✅ Fetched and processed NFTs:', nftsData.length);
    } catch (err) {
      console.error('❌ Failed to fetch NFTs:', err);
      setError(err?.message || 'Failed to load NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle NFT purchase
   */
  const handleBuyNFT = async (tokenId, price) => {
    if (!walletAddress) {
      alert('Please connect your wallet to buy NFTs');
      return;
    }

    setBuyingTokenId(tokenId);
    setError(null);
    setTxHash(null);

    try {
      console.log('💰 Buying NFT #' + tokenId);
      console.log('Price:', price, 'wei');
      console.log('Price in ETH:', ethers.formatEther(price));

      // Get contract instance with signer
      const contract = await getContract();

      // Buy NFT (send ETH with transaction)
      const tx = await contract.buyNFT(tokenId, { value: price });
      
      console.log('📝 Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ NFT purchased successfully!');
      console.log('Transaction hash:', receipt.hash);
      console.log('Block number:', receipt.blockNumber);

      // Show success message
      alert(`🎉 NFT #${tokenId} purchased successfully!`);

      // Refresh NFT list
      await fetchNFTs();

    } catch (err) {
      console.error('❌ Failed to buy NFT:', err);

      // Handle specific error cases
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction cancelled by user');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds to buy this NFT');
      } else if (err.message?.includes('not listed')) {
        setError('This NFT is no longer listed for sale');
      } else {
        setError(err.message || 'Failed to buy NFT. Please try again.');
      }
    } finally {
      setBuyingTokenId(null);
      setTxHash(null);
    }
  };

  /**
   * Set up real-time event listeners
   */
  const setupEventListeners = async () => {
    try {
      console.log('🎧 Setting up NFT event listeners...');

      const contract = await getContractReadOnly();

      // Listen for NFTMinted events
      const mintedFilter = contract.filters.NFTMinted();
      const mintedListener = (tokenId, owner, name) => {
        console.log('🔔 NFTMinted event:', Number(tokenId), owner, name);
        fetchNFTs(); // Refresh gallery
      };
      contract.on(mintedFilter, mintedListener);

      // Listen for NFTListed events
      const listedFilter = contract.filters.NFTListed();
      const listedListener = (tokenId, price, seller) => {
        console.log('🔔 NFTListed event:', Number(tokenId), price.toString(), seller);
        fetchNFTs(); // Refresh gallery
      };
      contract.on(listedFilter, listedListener);

      // Listen for NFTPurchased events
      const soldFilter = contract.filters.NFTPurchased();
      const soldListener = (tokenId, buyer, seller, price) => {
        console.log('🔔 NFTPurchased event:', Number(tokenId), buyer, price.toString());
        fetchNFTs(); // Refresh gallery
      };
      contract.on(soldFilter, soldListener);

      // Store listeners for cleanup
      eventListenerRef.current = {
        contract,
        listeners: [
          { filter: mintedFilter, listener: mintedListener },
          { filter: listedFilter, listener: listedListener },
          { filter: soldFilter, listener: soldListener }
        ]
      };

      console.log('✅ Event listeners set up successfully');

    } catch (err) {
      console.warn('⚠️ Could not set up event listeners:', err?.message);
      // Non-critical error, continue without real-time updates
    }
  };

  /**
   * Clean up event listeners
   */
  const cleanupEventListeners = () => {
    if (eventListenerRef.current) {
      const { contract, listeners } = eventListenerRef.current;
      try {
        listeners.forEach(({ filter, listener }) => {
          contract.off(filter, listener);
        });
        console.log('🔇 Event listeners cleaned up');
      } catch (err) {
        console.warn('⚠️ Error cleaning up event listeners:', err);
      }
      eventListenerRef.current = null;
    }
  };

  /**
   * Fetch NFTs on mount
   */
  useEffect(() => {
    fetchNFTs();
    setupEventListeners();

    return () => {
      cleanupEventListeners();
    };
  }, []);

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading NFT marketplace from blockchain...</p>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error && nfts.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-medium mb-1">Failed to Load NFTs</h3>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button
              onClick={fetchNFTs}
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
  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Listed</h3>
        <p className="text-gray-600 mb-4">Be the first to mint and list an NFT for sale!</p>
        <button
          onClick={fetchNFTs}
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
          NFT Marketplace ({nfts.length} {nfts.length === 1 ? 'NFT' : 'NFTs'})
        </h2>
        <button
          onClick={fetchNFTs}
          disabled={loading}
          className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Transaction Pending */}
      {buyingTokenId && txHash && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-blue-700 text-sm font-medium">Purchasing NFT #{buyingTokenId}...</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-xs underline flex items-center space-x-1"
              >
                <span>View on Etherscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* NFTs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(nfts || []).map((nft) => (
          <div
            key={nft?.tokenId || Math.random()}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* NFT Image Placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center relative">
              <ImageIcon className="w-16 h-16 text-white opacity-50" />
              {isMyNFT(nft?.owner) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  Your NFT
                </div>
              )}
            </div>

            {/* NFT Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {nft?.name || `NFT #${nft?.tokenId}`}
                  </h3>
                  <p className="text-xs text-gray-500">Token ID: #{nft?.tokenId}</p>
                </div>
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

              {/* Owner */}
              <div className="flex items-center justify-between text-sm mb-3 p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1 text-gray-600">
                  <User className="w-3 h-3" />
                  <span>Owner</span>
                </div>
                <span className="text-gray-900 font-mono text-xs">
                  {formatAddress(nft?.owner)}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-3 p-3 bg-primary-50 rounded-lg">
                <span className="text-sm text-gray-600">Price</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(nft?.priceInEth || 0).toFixed(4)} ETH
                  </p>
                  <p className="text-xs text-gray-500">
                    {nft?.price} wei
                  </p>
                </div>
              </div>

              {/* Buy Button */}
              {isMyNFT(nft?.owner) ? (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                >
                  You Own This NFT
                </button>
              ) : (
                <button
                  onClick={() => handleBuyNFT(nft?.tokenId, nft?.price)}
                  disabled={buyingTokenId === nft?.tokenId}
                  className={`w-full flex items-center justify-center space-x-2 font-medium py-2 px-4 rounded-lg transition-colors ${
                    buyingTokenId === nft?.tokenId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {buyingTokenId === nft?.tokenId ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Buying...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Buy Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NFTGallery;
