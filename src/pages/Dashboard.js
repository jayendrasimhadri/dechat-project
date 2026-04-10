import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import {
  createPublicRoom,
  createPrivateRoomWithNFT as contractCreatePrivateRoom,
  getAllRooms,
  getNFTsByOwner,
  getRoomRequiredNFT,
  mintNFT,
  listNFT,
  parseContractError,
} from '../utils/contract';
import { onRoomCreated } from '../utils/events';
import {
  MessageSquare, Users, Crown, Plus, X, Loader,
  AlertCircle, Lock, Globe, ShoppingCart, RefreshCw, Key
} from 'lucide-react';

const Dashboard = () => {
  const { walletAddress, chainId } = useWallet();
  const networkName = chainId === '0x7a69' ? 'Hardhat Local' : chainId === '0xaa36a7' ? 'Sepolia' : 'Unknown';
  const [rooms, setRooms] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  // roomId (number) → required NFT tokenId (number)
  const [roomRequiredNFTs, setRoomRequiredNFTs] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [roomForm, setRoomForm] = useState({ name: '', isPrivate: false, mintNFT: false, nftName: '' });

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const formatDate = (ts) => {
    try { return new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return 'Unknown'; }
  };

  // Check if user owns the SPECIFIC NFT required for this private room
  const userOwnsRequiredNFT = (room) => {
    if (!room.isPrivate) return true;
    const requiredId = roomRequiredNFTs[room.id];
    if (requiredId === undefined) return false; // still loading
    return userNFTs.some(n => n.tokenId === requiredId);
  };

  const fetchUserNFTs = async () => {
    if (!walletAddress) return;
    try {
      const nfts = await getNFTsByOwner(walletAddress);
      setUserNFTs(nfts.map(n => ({ tokenId: Number(n.tokenId), name: n.name, isListed: n.isListed })));
    } catch (err) {
      console.warn('Could not fetch user NFTs:', err.message);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const roomsData = await getAllRooms();
      const formatted = roomsData.filter(r => r.exists).map(r => ({
        id: Number(r.id), name: r.name, creator: r.creator,
        isPrivate: r.isPrivate, createdAt: Number(new Date(r.createdAt).getTime() / 1000), exists: r.exists
      }));
      setRooms(formatted);

      // For every private room, fetch which specific NFT token ID is required
      const privateRooms = formatted.filter(r => r.isPrivate);
      if (privateRooms.length > 0) {
        const entries = await Promise.all(
          privateRooms.map(async (r) => {
            try {
              const nftId = await getRoomRequiredNFT(r.id);
              return [r.id, nftId];
            } catch {
              return [r.id, null];
            }
          })
        );
        setRoomRequiredNFTs(Object.fromEntries(entries));
      }
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  // Real-time RoomCreated event listener
  useEffect(() => {
    let unsubscribe;
    onRoomCreated(({ roomId, creator, name, isPrivate }) => {
      const newRoom = {
        id: Number(roomId), name, creator, isPrivate,
        createdAt: Math.floor(Date.now() / 1000), exists: true
      };
      setRooms(prev => prev.find(r => r.id === newRoom.id) ? prev : [...prev, newRoom]);
    }).then(fn => { unsubscribe = fn; });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchUserNFTs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) { setError('Please enter a room name'); return; }
    if (roomForm.isPrivate && roomForm.mintNFT) {
      if (!roomForm.nftName.trim()) { setError('Please enter an NFT name'); return; }
    }
    setIsCreating(true);
    setError(null);
    try {
      // Track the minted access NFT so we can tie it to the room
      let accessNFTId = 0; // 0 = let contract auto-mint (creator-only room)

      if (roomForm.isPrivate && roomForm.mintNFT) {
        const { tokenId } = await mintNFT(roomForm.nftName.trim());
        if (tokenId !== null) {
          await listNFT(String(tokenId), '0.01');
          accessNFTId = tokenId; // pass this same NFT to the room — not 0
        }
      }

      if (roomForm.isPrivate) {
        // existingNFTId = the NFT we just minted & listed (or 0 for creator-only)
        await contractCreatePrivateRoom(roomForm.name.trim(), accessNFTId);
      } else {
        await createPublicRoom(roomForm.name.trim());
      }
      setRoomForm({ name: '', isPrivate: false, mintNFT: false, nftName: '' });
      setShowCreateRoom(false);
      await fetchRooms();
    } catch (err) {
      setError(parseContractError(err).message);
    } finally {
      setIsCreating(false);
    }
  };

  const createdRooms = rooms.filter(r => r.creator?.toLowerCase() === walletAddress?.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {formatAddress(walletAddress)}</p>
        </div>
        <button onClick={() => { fetchRooms(); fetchUserNFTs(); }} className="btn-secondary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, color: 'primary', label: 'Total Rooms', value: rooms.length },
          { icon: Plus, color: 'blue', label: 'Rooms Created', value: createdRooms.length },
          { icon: Crown, color: 'green', label: 'Owned NFTs', value: userNFTs.length },
          { icon: Users, color: 'purple', label: 'Network', value: networkName },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="card">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rooms */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Chat Rooms</h2>
          <button onClick={() => setShowCreateRoom(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" /><span>Create Room</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading rooms from blockchain...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm mb-2">{error}</p>
                <button onClick={fetchRooms} className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg">Try Again</button>
              </div>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Rooms Yet</h3>
            <p className="text-gray-500">Be the first to create a chat room!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const hasAccess = userOwnsRequiredNFT(room);
              const requiredNFTId = roomRequiredNFTs[room.id];
              const isCreator = room.creator?.toLowerCase() === walletAddress?.toLowerCase();
              return (
                <div key={room.id} className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                        {isCreator && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Creator</span>
                        )}
                        {room.isPrivate ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Lock className="w-3 h-3" /><span>Private</span>
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Globe className="w-3 h-3" /><span>Public</span>
                          </span>
                        )}
                        {room.isPrivate && hasAccess && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Crown className="w-3 h-3" /><span>Access Granted</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Creator: {formatAddress(room.creator)} • Created: {formatDate(room.createdAt)} • #{room.id}
                      </p>
                      {room.isPrivate && !hasAccess && requiredNFTId !== undefined && (
                        <p className="text-xs text-orange-600 mt-1">
                          🔒 Requires NFT Token #{requiredNFTId} to join
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {hasAccess || isCreator ? (
                        <Link to={`/room/${room.id}`} className="btn-primary">Enter Room</Link>
                      ) : (
                        <Link
                          to="/marketplace"
                          className="btn-secondary flex items-center space-x-1"
                          title={requiredNFTId !== undefined ? `You need NFT Token #${requiredNFTId}` : 'Requires NFT access'}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>
                            {requiredNFTId !== undefined ? `Get NFT #${requiredNFTId}` : 'Get NFT'}
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Room</h3>
              <button onClick={() => { setShowCreateRoom(false); setError(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text" value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="Enter room name" className="input-field" disabled={isCreating} maxLength={50} required
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={roomForm.isPrivate}
                  onChange={(e) => setRoomForm({ ...roomForm, isPrivate: e.target.checked, mintNFT: false })}
                  disabled={isCreating} className="w-4 h-4 text-primary-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Private Room</span>
                  <p className="text-xs text-gray-500">Requires NFT ownership to join</p>
                </div>
              </label>

              {roomForm.isPrivate && (
                <div className="pl-4 border-l-2 border-orange-200 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={roomForm.mintNFT}
                      onChange={(e) => setRoomForm({ ...roomForm, mintNFT: e.target.checked })}
                      disabled={isCreating} className="w-4 h-4 text-primary-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Mint Access NFT</span>
                      <p className="text-xs text-gray-500">Create and list an NFT for room access</p>
                    </div>
                  </label>

                  {roomForm.mintNFT && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NFT Name</label>
                      <input type="text" value={roomForm.nftName}
                        onChange={(e) => setRoomForm({ ...roomForm, nftName: e.target.value })}
                        placeholder="e.g. RoomKeyNFT" className="input-field" disabled={isCreating}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">💡 Creating a room requires a MetaMask transaction.</p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => { setShowCreateRoom(false); setError(null); }}
                  className="flex-1 btn-secondary" disabled={isCreating}>Cancel</button>
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center space-x-2" disabled={isCreating}>
                  {isCreating ? <><Loader className="w-4 h-4 animate-spin" /><span>Creating...</span></> : <><Plus className="w-4 h-4" /><span>Create</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
