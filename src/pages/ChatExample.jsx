/**
 * ChatExample Page
 * 
 * Demonstrates the complete integration of:
 * - CreateRoom component
 * - RoomsList component
 * - RoomChat component
 */

import React, { useState } from 'react';
import CreateRoom from '../components/CreateRoom';
import RoomsList from '../components/RoomsList';
import RoomChat from '../components/RoomChat';
import { MessageSquare, Plus, ArrowLeft } from 'lucide-react';

const ChatExample = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Handle room creation success
   */
  const handleRoomCreated = (roomId) => {
    console.log('Room created with ID:', roomId);
    
    // Refresh rooms list
    setRefreshTrigger(prev => prev + 1);
    
    // Close create room modal
    setShowCreateRoom(false);
    
    // Optionally select the newly created room
    if (roomId) {
      setSelectedRoomId(roomId);
    }
  };

  /**
   * Handle room selection from list
   */
  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
  };

  /**
   * Go back to rooms list
   */
  const handleBackToRooms = () => {
    setSelectedRoomId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DeChat</h1>
              <p className="text-gray-600 text-sm">
                Decentralized chat powered by smart contracts
              </p>
            </div>
          </div>
          {!selectedRoomId && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedRoomId ? (
          // Chat View
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4">
              <button
                onClick={handleBackToRooms}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Rooms</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RoomChat roomId={selectedRoomId} />
            </div>
          </div>
        ) : (
          // Rooms List View
          <div className="h-full overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              <RoomsList 
                refreshTrigger={refreshTrigger}
                onRoomSelect={handleRoomSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Room</h2>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <CreateRoom onRoomCreated={handleRoomCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatExample;
