import React, { useState, useEffect } from 'react';
import { fetchUserNFTs } from '../utils/nft';
import { Image, Loader } from 'lucide-react';

const UserNFTDisplay = ({ walletAddress, displayMode = 'grid' }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNFTs = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const userNFTs = await fetchUserNFTs(walletAddress);
        setNfts(userNFTs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNFTs();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading NFTs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Failed to load NFTs: {error}</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">No NFTs found</p>
      </div>
    );
  }

  if (displayMode === 'header') {
    // Compact display for chat header
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">NFTs:</span>
        <div className="flex -space-x-2">
          {nfts.slice(0, 3).map((nft, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
              title={nft.name}
            >
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600"></div>';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
              )}
            </div>
          ))}
          {nfts.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-600">+{nfts.length - 3}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid display for modal/profile
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {nfts.map((nft, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="aspect-square bg-gray-100">
            {nft.image ? (
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><svg class="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Image className="w-12 h-12 text-white opacity-50" />
              </div>
            )}
          </div>
          <div className="p-3">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {nft.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">{nft.collection}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserNFTDisplay;
