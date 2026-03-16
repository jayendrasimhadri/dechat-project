/**
 * CreateRoom Component
 * 
 * Allows users to create a new chat room on the smart contract.
 * Uses ethers.js v6 to interact with the DeChat contract.
 */

import { useState } from 'react';
import { createPublicRoom, createPrivateRoomWithNFT } from '../utils/dechat-sdk';
import { Plus, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const CreateRoom = ({ onRoomCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle room creation
   */
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      console.log('🚀 Creating room:', roomName, 'Private:', isPrivate);

      let roomId;
      if (isPrivate) {
        // Private room: also mints an NFT — metadataURI can be extended later
        const result = await createPrivateRoomWithNFT(
          roomName.trim(),
          `${roomName.trim()} Access Pass`,
          'ipfs://placeholder'
        );
        roomId = result.roomId;
        setTxHash(result.roomTxHash);
      } else {
        const result = await createPublicRoom(roomName.trim());
        roomId = result.roomId;
        setTxHash(result.txHash);
      }

      console.log('✅ Room created! ID:', roomId);
      setSuccess(true);
      setRoomName('');
      setIsPrivate(false);

      // Call callback to refresh rooms list
      if (onRoomCreated) {
        onRoomCreated(roomId);
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setTxHash(null);
      }, 5000);

    } catch (err) {
      console.error('Failed to create room:', err);
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
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
              <h3 className="text-green-900 font-medium mb-1">Room Created Successfully!</h3>
              <p className="text-green-700 text-sm mb-2">
                Your chat room has been created on the blockchain.
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
              <h3 className="text-red-900 font-medium mb-1">Failed to Create Room</h3>
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
      {isCreating && txHash && (
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

      {/* Create Room Form */}
      <form onSubmit={handleCreateRoom} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Name
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name (e.g., General Chat)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isCreating}
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            {roomName.length}/50 characters
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={isCreating}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Private Room</span>
              <p className="text-xs text-gray-500">
                Only invited members can join this room
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 text-sm">
              Creating a room requires a blockchain transaction. You'll need to confirm it in MetaMask and pay a small gas fee.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || !roomName.trim()}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            isCreating || !roomName.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isCreating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Creating Room...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Create Room</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;
