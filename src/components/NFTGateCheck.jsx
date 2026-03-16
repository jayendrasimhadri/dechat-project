import React, { useState, useEffect } from 'react';
import { checkNFTOwnership } from '../utils/nft';
import { Lock, CheckCircle, XCircle, Loader } from 'lucide-react';

const NFTGateCheck = ({ room, userAddress, onAccessGranted, onAccessDenied }) => {
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!room || !userAddress) {
        setChecking(false);
        return;
      }

      if (!room.isNFTGated) {
        setHasAccess(true);
        setChecking(false);
        if (onAccessGranted) onAccessGranted();
        return;
      }

      try {
        const owns = await checkNFTOwnership(userAddress, room.nftContract);
        setHasAccess(owns);
        
        if (owns && onAccessGranted) {
          onAccessGranted();
        } else if (!owns && onAccessDenied) {
          onAccessDenied();
        }
      } catch (error) {
        console.error('Access check failed:', error);
        setHasAccess(false);
        if (onAccessDenied) onAccessDenied();
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [room, userAddress, onAccessGranted, onAccessDenied]);

  if (checking) {
    return (
      <div className="flex items-center space-x-2 text-gray-600 p-3 bg-gray-50 rounded-lg">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking NFT ownership...</span>
      </div>
    );
  }

  if (!room || !room.isNFTGated) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
      hasAccess 
        ? 'bg-green-50 text-green-700' 
        : 'bg-red-50 text-red-700'
    }`}>
      {hasAccess ? (
        <>
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">NFT Verified</p>
            <p className="text-xs opacity-75">You own the required NFT</p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Access Denied</p>
            <p className="text-xs opacity-75">
              Required NFT: {room.nftContract.slice(0, 6)}...{room.nftContract.slice(-4)}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default NFTGateCheck;
