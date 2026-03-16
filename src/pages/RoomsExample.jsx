/**
 * Example Page: RoomsList Integration
 * 
 * This page demonstrates how to use the RoomsList component
 * to fetch and display rooms from the smart contract.
 */

import React from 'react';
import RoomsList from '../components/RoomsList';
import { MessageSquare } from 'lucide-react';

const RoomsExample = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-primary-600" />
            <span>Smart Contract Rooms</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Rooms fetched directly from the DeChat smart contract on Sepolia
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-900 font-medium mb-2">📡 Live Contract Data</h3>
        <p className="text-blue-700 text-sm">
          This component fetches rooms using <code className="bg-blue-100 px-1 rounded">contract.getAllRooms()</code> from your deployed smart contract.
          Make sure your contract is deployed and the address is configured in <code className="bg-blue-100 px-1 rounded">src/utils/contract.js</code>.
        </p>
      </div>

      {/* RoomsList Component */}
      <div className="card">
        <RoomsList />
      </div>
    </div>
  );
};

export default RoomsExample;
