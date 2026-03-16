import React, { useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useChat } from '../../contexts/ChatContext';
import { getContract } from '../../utils/contract';
import { ethers } from 'ethers';
import { 
  Settings, 
  Coins, 
  Users, 
  TrendingUp,
  Eye,
  Edit,
  Loader,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const RoomManagement = ({ room }) => {
  // Removed NFTContext - use blockchain directly if needed
  const { walletAddress } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [minting, setMinting] = useState(false);
  const [listing, setListing] = useState(false);
  const [nftForm, setNftForm] = useState({
    nftName: `${room.name} Access Pass`,
    symbol: 'RAP',
    totalSupply: 100,
    mintPrice: '0.1',
    image: 'https://via.placeholder.com/300/6366f1/ffffff?text=Access+Pass',
    description: `Exclusive access to ${room.name}`
  });

  const handleMintNFT = async () => {
    setMinting(true);
    try {
      // Use blockchain directly
      const contract = await getContract();
      const tx = await contract.mintNFT(nftForm.nftName, nftForm.description);
      const receipt = await tx.wait();
      
      alert(`NFT minted successfully! Transaction: ${receipt.hash}`);
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      alert('Failed to mint NFT: ' + error.message);
    } finally {
      setMinting(false);
    }
  };

  const handleListForSale = async (tokenId) => {
    setListing(true);
    try {
      // Use blockchain directly
      const contract = await getContract();
      const priceInWei = ethers.parseEther(nftForm.mintPrice);
      const tx = await contract.listNFT(tokenId, priceInWei);
      const receipt = await tx.wait();

      alert('NFT listed for sale successfully!');
    } catch (error) {
      console.error('Failed to list NFT:', error);
      alert('Failed to list NFT: ' + error.message);
    } finally {
      setListing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNftForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Room: {room.name}</h2>
          <p className="text-gray-600">Create and manage NFTs for your private room</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('mint-nft')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'mint-nft'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Mint NFTs
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'analytics'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{room.memberCount}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">0.5 ETH</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">NFTs Sold</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mint NFT Tab */}
      {activeTab === 'mint-nft' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Room Access NFTs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NFT Name *
                </label>
                <input
                  type="text"
                  value={nftForm.nftName}
                  onChange={(e) => handleInputChange('nftName', e.target.value)}
                  placeholder="e.g., VIP Access Pass"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={nftForm.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  placeholder="e.g., VAP"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    value={nftForm.totalSupply}
                    onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                    placeholder="100"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={nftForm.mintPrice}
                    onChange={(e) => handleInputChange('mintPrice', e.target.value)}
                    placeholder="0.1"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={nftForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this NFT provides access to..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={nftForm.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="https://example.com/nft-image.jpg"
                  className="input-field"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">NFT Preview</h4>
                <img
                  src={nftForm.image}
                  alt="NFT Preview"
                  className="w-full h-48 object-cover rounded-lg mb-3"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300/6366f1/ffffff?text=NFT+Preview';
                  }}
                />
                <h5 className="font-medium text-gray-900">{nftForm.nftName}</h5>
                <p className="text-sm text-gray-600 mb-2">{nftForm.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Supply: {nftForm.totalSupply}</span>
                  <span className="font-semibold">{nftForm.mintPrice} ETH</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-yellow-800">Important Notes</h5>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• NFTs will be automatically listed in the marketplace</li>
                      <li>• Users can purchase NFTs to gain room access</li>
                      <li>• You'll receive royalties from sales</li>
                      <li>• This action requires blockchain transaction</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleMintNFT}
                disabled={minting || listing}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {minting || listing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Coins className="w-4 h-4" />
                )}
                <span>
                  {minting ? 'Minting NFTs...' : 
                   listing ? 'Listing for Sale...' : 
                   'Mint & List NFTs'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Member Growth</h4>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart placeholder</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">NFT Sales</h4>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart placeholder</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">NFT Purchased</p>
                  <p className="text-xs text-gray-500">User 0x123...abc bought access NFT for 0.1 ETH</p>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">New Member Joined</p>
                  <p className="text-xs text-gray-500">User 0x456...def joined the room</p>
                </div>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;