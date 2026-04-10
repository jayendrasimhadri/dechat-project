/**
 * MintNFT Component
 * 
 * Allows users to mint new NFTs on the smart contract.
 * Uses ethers.js v6 to interact with the DeChat contract.
 */

import React, { useState } from 'react';
import { getContract } from '../utils/contract';
import { Sparkles, Loader, CheckCircle, XCircle } from 'lucide-react';

const MintNFT = ({ onNFTMinted }) => {
  const [nftName, setNftName] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState(null);

  /**
   * Handle NFT minting
   */
  const handleMintNFT = async (e) => {
    e.preventDefault();

    if (!nftName.trim()) {
      setError('Please enter an NFT name');
      return;
    }

    setIsMinting(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);
    setMintedTokenId(null);

    try {
      console.log('🎨 Minting NFT:', nftName);

      // Get contract instance with signer
      const contract = await getContract();

      // Placeholder URI — contract requires non-empty value
      const uri = `ipfs://dechat/${encodeURIComponent(nftName.trim())}`;
      const tx = await contract.mintNFT(nftName.trim(), uri);
      
      console.log('📝 Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('✅ NFT minted! Receipt:', receipt);

      // Extract token ID from events
      let tokenId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const nftMintedEvent = receipt.logs.find(log => {
            try {
              const parsed = contract.interface.parseLog(log);
              return parsed && parsed.name === 'NFTMinted';
            } catch {
              return false;
            }
          });

          if (nftMintedEvent) {
            const parsed = contract.interface.parseLog(nftMintedEvent);
            tokenId = parsed.args.tokenId?.toString();
            console.log('🆔 Token ID:', tokenId);
            setMintedTokenId(tokenId);
          }
        } catch (err) {
          console.warn('Could not parse token ID from event:', err);
        }
      }

      // Show success
      setSuccess(true);
      setNftName('');

      // Call callback
      if (onNFTMinted) {
        onNFTMinted(tokenId);
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
        setMintedTokenId(null);
      }, 5000);

    } catch (err) {
      console.error('Failed to mint NFT:', err);

      // Handle specific error cases
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction rejected by user');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds to pay for gas');
      } else if (err.message?.includes('user rejected')) {
        setError('Transaction rejected by user');
      } else {
        setError(err.message || 'Failed to mint NFT. Please try again.');
      }
    } finally {
      setIsMinting(false);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-green-900 font-medium mb-1">NFT Minted Successfully!</h3>
              <p className="text-green-700 text-sm mb-2">
                Your NFT has been minted on the blockchain.
                {mintedTokenId && ` Token ID: #${mintedTokenId}`}
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 text-sm font-medium underline"
                >
                  View on Etherscan →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-900 font-medium mb-1">Failed to Mint NFT</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction Pending */}
      {isMinting && txHash && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-900 font-medium mb-1">Transaction Pending</h3>
              <p className="text-blue-700 text-sm mb-2">
                Waiting for blockchain confirmation...
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
              >
                View on Etherscan →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mint NFT Form */}
      <form onSubmit={handleMintNFT} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NFT Name
          </label>
          <input
            type="text"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder="Enter NFT name (e.g., My Awesome NFT)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isMinting}
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {nftName.length}/100 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isMinting || !nftName.trim()}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            isMinting || !nftName.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isMinting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Minting NFT...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Mint NFT</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MintNFT;
