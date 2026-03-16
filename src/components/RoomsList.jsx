/**
 * RoomsList Component
 * 
 * Fetches and displays all chat rooms from the smart contract.
 * Uses ethers.js v6 to interact with the DeChat contract.
 */

import React, { useState, useEffect } from 'react';
import { getContractReadOnly } from '../utils/contract';
import { Users, Lock, Globe, AlertCircle, Loader } from 'lucide-react';

const RoomsList = ({ refreshTrigger, onRoomSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Format wallet address to short version
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Fetch all rooms from smart contract
   */
  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📥 Fetching all rooms from blockchain using getAllRooms()...');

      // Get contract instance (read-only)
      const contract = await getContractReadOnly();

      // Fetch ALL rooms directly from contract
      const allRooms = await contract.getAllRooms();
      
      console.log('📊 Raw rooms from blockchain:', allRooms.length);

      // Transform data for display - NO FILTERING by creator or membership
      const roomsData = allRooms
        .filter(room => room.exists) // Only filter out deleted rooms
        .map(room => ({
          id: Number(room.id), // Convert BigInt to Number
          name: room.name,
          creator: room.creator,
          isPrivate: room.isPrivate,
          createdAt: Number(room.createdAt), // Convert BigInt to Number
          exists: room.exists
        }));

      setRooms(roomsData);
      console.log('✅ Displaying rooms to user:', roomsData.length);
      console.log('📋 Room IDs:', roomsData.map(r => r.id));
    } catch (err) {
      console.error('❌ Failed to fetch rooms:', err);
      setError(err.message || 'Failed to load chat rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch rooms on component mount and when refreshTrigger changes
   */
  useEffect(() => {
    fetchRooms();
  }, [refreshTrigger]);

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading chat rooms...</p>
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
            <h3 className="text-red-900 font-medium mb-1">Failed to Load Rooms</h3>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <button
              onClick={fetchRooms}
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
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat Rooms Yet</h3>
        <p className="text-gray-600 mb-4">Be the first to create a chat room!</p>
        <button
          onClick={fetchRooms}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  /**
   * Rooms list
   */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Chat Rooms ({rooms.length})
        </h2>
        <button
          onClick={fetchRooms}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Room Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {room.name}
                  </h3>
                  {room.isPrivate ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex-shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex-shrink-0">
                      <Globe className="w-3 h-3" />
                      <span>Public</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Creator</span>
                <span className="text-gray-900 font-mono text-xs">
                  {formatAddress(room.creator)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900 text-xs">
                  {formatDate(room.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Room ID</span>
                <span className="text-gray-900 font-mono text-xs">
                  #{room.id}
                </span>
              </div>
            </div>

            {/* Join Button */}
            <button 
              onClick={() => onRoomSelect && onRoomSelect(room.id)}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Join Room
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsList;
