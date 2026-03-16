/**
 * ListNFT Component - Blockchain-Only Version
 * 
 * Allows users to list their NFTs for sale on the marketplace.
 * Requires MetaMask approval for listing transaction.
 */

import React, { useState } from 'react';
import { getContract } from '../utils/contract';
import { ethers } from 'ethers';
import {
  DollarSign,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';

const ListNFT = ({ nft, onClose, onSuccess }) => {
  const [price, setPrice] = useState('');
  const [listing, setListing] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle listing NFT for sale
   */
  const handleListNFT = async (e) => {
    e.preventDefault();

    // Validate price
    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    setListing(true);
    setError(null);
    setTxHash(null);
    setSuccess(false);

    try {
      console.log('📝 Listing NFT for sale...');
      console.log('Token ID:', nft.tokenId);
      console.log('Price:', price, 'ETH');

      // Convert price to wei
      const priceInWei = ethers.parseEther(price);
      console.log('Price in wei:', priceInWei.toString());

      // Get contract instance with signer
      const contract = await getContract();

      // List NFT for sale
      const tx = await contract.listNFT(nft.tokenId, priceInWei);
      
      console.log('📝 Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ NFT listed successfully!');
      console.log('Transaction hash:', receipt.hash);
      console.log('Block number:', receipt.blockNumber);

      // Show success
      setSuccess(true);

      // Call success callback after delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (err) {
      console.error('❌ Failed to list NFT:', err);

      // Handle specific error cases
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction cancelled by user');
      } else if (err.message?.includes('not owner')) {
        setError('You are not the owner of this NFT');
      } else if (err.message?.includes('already listed')) {
        setError('This NFT is already listed for sale');
      } else {
        setError(err.message || 'Failed to list NFT. Please try again.');
      }
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">List NFT for Sale</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={listing}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                NFT Listed Successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                Your NFT is now available on the marketplace.
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 underline flex items-center justify-center space-x-1"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <>
              {/* NFT Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {nft?.name || `NFT #${nft?.tokenId}`}
                </h3>
                <p className="text-sm text-gray-600">Token ID: #{nft?.tokenId}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleListNFT} className="space-y-4">
                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price (ETH)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.0000"
                      className="input-field pl-10"
                      disabled={listing}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: 0.0001 ETH
                  </p>
                </div>

                {/* Price Preview */}
                {price && parseFloat(price) > 0 && (
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Listing Price:</span>
                      <span className="font-bold text-gray-900">{price} ETH</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-500">In Wei:</span>
                      <span className="text-gray-700 font-mono">
                        {ethers.parseEther(price || '0').toString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Transaction Pending */}
                {listing && txHash && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Loader className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-blue-700 text-sm font-medium">Listing NFT...</p>
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

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={listing}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={listing || !price || parseFloat(price) <= 0}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {listing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Listing...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" />
                        <span>List for Sale</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    ℹ️ Listing your NFT requires a blockchain transaction. You'll need to approve it in MetaMask and pay gas fees.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListNFT;
