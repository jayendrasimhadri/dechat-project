import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContractReadOnly } from '../utils/contract';
import { useWallet } from '../contexts/WalletContext';
import { useChat } from '../contexts/ChatContext';
import { ethers } from 'ethers';
import {
  User, MessageSquare, Crown, Copy, ExternalLink, Loader,
  AlertCircle, Lock, Globe, Edit3, Save, X, Plus,
  MessageCircle, Image as ImageIcon, DollarSign, RefreshCw
} from 'lucide-react';

const Profile = () => {
  const { walletAddress, userProfile, updateProfile } = useWallet();
  const { chats } = useChat();

  const [rooms, setRooms] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const formatDate = (ts) => {
    try { return new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return 'Unknown'; }
  };
  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const fetchData = async () => {
    if (!walletAddress) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const contract = await getContractReadOnly();
      const [allRooms, nfts] = await Promise.all([
        contract.getAllRooms(),
        contract.getNFTsByOwner(walletAddress).catch(() => [])
      ]);

      setRooms((allRooms || []).filter(r => r.exists).map(r => ({
        id: Number(r.id), name: r.name, creator: r.creator,
        isPrivate: r.isPrivate, createdAt: Number(r.createdAt)
      })));

      setMyNFTs((nfts || []).map(n => ({
        tokenId: Number(n.tokenId),
        name: n.name || `NFT #${n.tokenId}`,
        owner: n.owner,
        metadataURI: n.metadataURI,
        priceInEth: ethers.formatEther(n.price || 0),
        isListed: n.isListed
      })));
    } catch (err) {
      setError(err?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);
  useEffect(() => { setEditForm(userProfile || {}); }, [userProfile]);

  const copyAddress = async () => {
    if (!walletAddress) return;
    try { await navigator.clipboard.writeText(walletAddress); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => { updateProfile(editForm); setIsEditing(false); };

  // Build contacts list from private chats
  const contacts = chats.map(chat => {
    const other = chat.participants.find(p => p?.toLowerCase() !== walletAddress?.toLowerCase());
    const last = chat.messages[chat.messages.length - 1];
    return { address: other, lastMessage: last?.content || '', lastTime: last?.timestamp || '', chatId: chat.id };
  }).filter(c => c.address);

  const myRooms = rooms.filter(r => r.creator?.toLowerCase() === walletAddress?.toLowerCase());
  const otherRooms = rooms.filter(r => r.creator?.toLowerCase() !== walletAddress?.toLowerCase());

  const tabs = [
    { id: 'rooms', label: 'Rooms', icon: MessageSquare, count: rooms.length },
    { id: 'nfts', label: 'NFTs', icon: Crown, count: myNFTs.length },
    { id: 'contacts', label: 'Contacts', icon: MessageCircle, count: contacts.length },
  ];

  if (!walletAddress) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <Link to="/" className="btn-primary">Connect Wallet</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading profile from blockchain...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start space-x-5">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {userProfile?.avatar
              ? <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {userProfile?.displayName || formatAddress(walletAddress)}
              </h1>
              <button onClick={copyAddress} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
              {copied && <span className="text-sm text-green-600 font-medium">Copied!</span>}
            </div>
            <p className="text-gray-500 text-sm mb-2 truncate">{walletAddress}</p>
            {userProfile?.bio && <p className="text-gray-600 text-sm mb-2">{userProfile.bio}</p>}
            <a href={`https://sepolia.etherscan.io/address/${walletAddress}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1 w-fit">
              <span>View on Etherscan</span><ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isEditing ? (
              <>
                <button onClick={handleSave} className="btn-primary flex items-center space-x-1">
                  <Save className="w-4 h-4" /><span>Save</span>
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center space-x-1">
                  <X className="w-4 h-4" /><span>Cancel</span>
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center space-x-1">
                <Edit3 className="w-4 h-4" /><span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: 'displayName', label: 'Display Name', placeholder: 'Your name', type: 'text' },
              { field: 'bio', label: 'Bio', placeholder: 'About you', type: 'text' },
              { field: 'avatar', label: 'Avatar URL', placeholder: 'https://...', type: 'url' },
              { field: 'website', label: 'Website', placeholder: 'https://...', type: 'url' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={editForm[field] || ''}
                  onChange={(e) => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={placeholder} className="input-field" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, color: 'blue', label: 'Rooms Created', value: myRooms.length },
          { icon: Globe, color: 'green', label: 'Total Rooms', value: rooms.length },
          { icon: Crown, color: 'yellow', label: 'NFTs Owned', value: myNFTs.length },
          { icon: MessageCircle, color: 'purple', label: 'Contacts', value: contacts.length },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="card text-center py-4">
            <Icon className={`w-7 h-7 text-${color}-500 mx-auto mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* My Rooms */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Rooms You Created ({myRooms.length})</h3>
                  <Link to="/dashboard" className="btn-primary text-sm flex items-center space-x-1">
                    <Plus className="w-3 h-3" /><span>Create Room</span>
                  </Link>
                </div>
                {myRooms.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No rooms created yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myRooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0">
                          <MessageSquare className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-medium text-gray-900 text-sm truncate">{room.name}</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Creator</span>
                              {room.isPrivate
                                ? <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 flex-shrink-0"><Lock className="w-2.5 h-2.5" /><span>Private</span></span>
                                : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 flex-shrink-0"><Globe className="w-2.5 h-2.5" /><span>Public</span></span>}
                            </div>
                            <p className="text-xs text-gray-500">Created {formatDate(room.createdAt)} • #{room.id}</p>
                          </div>
                        </div>
                        <Link to={`/room/${room.id}`} className="btn-secondary text-xs ml-3 flex-shrink-0">Enter</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Rooms */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Other Rooms ({otherRooms.length})</h3>
                {otherRooms.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Globe className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No other rooms available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {otherRooms.slice(0, 10).map(room => (
                      <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0">
                          <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-medium text-gray-900 text-sm truncate">{room.name}</span>
                              {room.isPrivate
                                ? <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 flex-shrink-0"><Lock className="w-2.5 h-2.5" /><span>Private</span></span>
                                : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 flex-shrink-0"><Globe className="w-2.5 h-2.5" /><span>Public</span></span>}
                            </div>
                            <p className="text-xs text-gray-500">By {formatAddress(room.creator)} • #{room.id}</p>
                          </div>
                        </div>
                        <Link to={`/room/${room.id}`} className="btn-secondary text-xs ml-3 flex-shrink-0">View</Link>
                      </div>
                    ))}
                    {otherRooms.length > 10 && (
                      <Link to="/dashboard" className="block text-center text-sm text-primary-600 hover:text-primary-700 pt-2">
                        View all {otherRooms.length} rooms →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NFTs Tab */}
          {activeTab === 'nfts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">My NFTs ({myNFTs.length})</h3>
                <Link to="/marketplace" className="btn-primary text-sm flex items-center space-x-1">
                  <Plus className="w-3 h-3" /><span>Mint NFT</span>
                </Link>
              </div>
              {myNFTs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium mb-1">No NFTs Yet</h4>
                  <p className="text-gray-500 text-sm mb-4">Mint your first NFT from the marketplace</p>
                  <Link to="/marketplace" className="btn-primary text-sm">Go to Marketplace</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myNFTs.map(nft => (
                    <div key={nft.tokenId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-36 bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center relative">
                        <ImageIcon className="w-12 h-12 text-white opacity-40" />
                        {nft.isListed && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">Listed</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm truncate">{nft.name}</p>
                        <p className="text-xs text-gray-500 mb-2">Token #{nft.tokenId}</p>
                        {nft.isListed ? (
                          <div className="flex items-center justify-between text-xs bg-green-50 rounded p-2">
                            <span className="text-green-700 font-medium">Listed</span>
                            <span className="font-bold text-green-900">{parseFloat(nft.priceInEth).toFixed(4)} ETH</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Not listed</span>
                            <Link to="/marketplace" className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" /><span>List for sale</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Private Chat Contacts ({contacts.length})</h3>
                <Link to="/private-chats" className="btn-primary text-sm flex items-center space-x-1">
                  <Plus className="w-3 h-3" /><span>New Chat</span>
                </Link>
              </div>
              {contacts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium mb-1">No Contacts Yet</h4>
                  <p className="text-gray-500 text-sm mb-4">Start a private conversation to add contacts</p>
                  <Link to="/private-chats" className="btn-primary text-sm">Start Chatting</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map(contact => (
                    <div key={contact.chatId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{formatAddress(contact.address)}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.address}</p>
                          {contact.lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{contact.lastMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                        {contact.lastTime && (
                          <span className="text-xs text-gray-400">{formatTime(contact.lastTime)}</span>
                        )}
                        <Link to="/private-chats" className="btn-secondary text-xs">Message</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
