/**
 * NFTMarketplace Component
 * 
 * Displays all listed NFTs and allows users to buy them.
 * Uses ethers.js v6 to interact with the DeChat contract.
 */

import React, { useState, useEffect } from 'react';
import { getContract, getContractReadOnly } from '../utils/contract';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { ShoppingCart, Loader, AlertCircle, Tag, RefreshCw, CheckCircle } from 'lucide-react';

const NFTMarketplace = ({ refreshTrigger }) => {
  const { account } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingTokenId, setBuyingTokenId] = useState(null);
  const [txHash, setTxHash] = useState(null);

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
    return account && ownerAddress.toLowerCase() === account.toLowerCase();
  };

  /**
   * Fetch all listed NFTs from smart contract
   */
  const fetchNFTs = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🛒 Fetching listed NFTs...');

      // Get contract instance (read-only)
      const contract = await getContractReadOnly();

      // Fetch all listed NFTs
      const listedNFTs = await contract.getAllListedNFTs();

      // Transform data for display
      const nftsData = listedNFTs
        .filter(nft => nft.isListed) // Only show listed NFTs
        .map((nft) => ({
          tokenId: nft.tokenId.toString(),
          owner: nft.owner,
          name: nft.name,
          metadataURI: nft.metadataURI,
          price: nft.price.toString(),
          priceInEth: ethers.formatEther(nft.price),
          isListed: nft.isListed
        }));

      setNfts(nftsData);
      console.log('✅ Fetched NFTs:', nftsData.length);
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
      setError(err.message || 'Failed to load NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle NFT purchase
   */
  const handleBuyNFT = async (tokenId, price) => {
    setBuyingTokenId(tokenId);
    setError(null);
    setTxHash(null);

    try {
      console.log('💰 Buying NFT:', tokenId, 'Price:', price);

      // Get contract instance with signer
      const contract = await getContract();

      // Buy NFT (send ETH with transaction)
      const tx = await contract.buyNFT(tokenId, { value: price });
      
      console.log('📝 Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ NFT purchased! Receipt:', receipt);

      // Show success message
      alert(`🎉 NFT #${tokenId} purchased successfully!`);

      // Refresh NFT list
      await fetchNFTs();

    } catch (err) {
      console.error('Failed to buy NFT:', err);

      // Handle specific error cases
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction rejected by user');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds to buy this NFT');
      } else if (err.message?.includes('user rejected')) {
        setError('Transaction rejected by user');
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
   * Fetch NFTs on component mount and when refreshTrigger changes
   */
  useEffect(() => {
    fetchNFTs();
  }, [refreshTrigger]);

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading NFT marketplace...</p>
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
        <p className="text-gray-600 mb-4">Be the first to list an NFT for sale!</p>
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
          NFT Marketplace ({nfts.length})
        </h2>
        <button
          onClick={fetchNFTs}
          disabled={loading}
          className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
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
              <p className="text-blue-700 text-sm font-medium">Purchasing NFT...</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-xs underline"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* NFTs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* NFT Image Placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
              <Tag className="w-16 h-16 text-white opacity-50" />
            </div>

            {/* NFT Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {nft.name || `NFT #${nft.tokenId}`}
                  </h3>
                  <p className="text-xs text-gray-500">Token ID: #{nft.tokenId}</p>
                </div>
                {isMyNFT(nft.owner) && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Your NFT
                  </span>
                )}
              </div>

              {/* Metadata URI */}
              {nft.metadataURI && (
                <div className="mb-3">
                  <a
                    href={nft.metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 underline truncate block"
                  >
                    View Metadata →
                  </a>
                </div>
              )}

              {/* Owner */}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-600">Owner</span>
                <span className="text-gray-900 font-mono text-xs">
                  {formatAddress(nft.owner)}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Price</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(nft.priceInEth).toFixed(4)} ETH
                  </p>
                  <p className="text-xs text-gray-500">
                    {nft.price} wei
                  </p>
                </div>
              </div>

              {/* Buy Button */}
              {isMyNFT(nft.owner) ? (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                >
                  You Own This NFT
                </button>
              ) : (
                <button
                  onClick={() => handleBuyNFT(nft.tokenId, nft.price)}
                  disabled={buyingTokenId === nft.tokenId}
                  className={`w-full flex items-center justify-center space-x-2 font-medium py-2 px-4 rounded-lg transition-colors ${
                    buyingTokenId === nft.tokenId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {buyingTokenId === nft.tokenId ? (
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

export default NFTMarketplace;
