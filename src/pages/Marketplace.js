import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getAllListedNFTs, mintNFT, listNFT, buyNFT, parseContractError } from '../utils/contract';
import { onNFTMinted, onNFTListed, onNFTPurchased } from '../utils/events';
import {
  ShoppingCart, Plus, Sparkles, Loader, AlertCircle,
  RefreshCw, Image as ImageIcon, User, X, DollarSign, CheckCircle
} from 'lucide-react';

const Marketplace = () => {
  const { walletAddress } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [showMint, setShowMint] = useState(false);
  const [mintForm, setMintForm] = useState({ name: '', listPrice: '' });
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState(null);
  const [mintSuccess, setMintSuccess] = useState(false);

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const isMyNFT = (owner) => walletAddress && owner?.toLowerCase() === walletAddress.toLowerCase();

  const fetchNFTs = async () => {
    setLoading(true);
    setError(null);
    try {
      const listed = await getAllListedNFTs();
      setNfts(listed.map(n => ({
        tokenId: Number(n.tokenId),
        owner: n.owner,
        name: n.name || `NFT #${n.tokenId}`,
        metadataURI: n.metadataURI,
        price: n.priceWei,
        priceInEth: n.priceEth,
        isListed: n.isListed
      })));
    } catch (err) {
      setError(parseContractError(err).message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time event listeners
  useEffect(() => {
    let unsubs = [];
    const setup = async () => {
      unsubs.push(await onNFTMinted(() => fetchNFTs()));
      unsubs.push(await onNFTListed(() => fetchNFTs()));
      unsubs.push(await onNFTPurchased(() => fetchNFTs()));
    };
    setup();
    return () => unsubs.forEach(fn => fn?.());
  }, []);

  useEffect(() => { fetchNFTs(); }, []);

  const handleBuy = async (tokenId, price) => {
    if (!walletAddress) { alert('Connect your wallet first'); return; }
    setBuyingId(tokenId);
    try {
      await buyNFT(tokenId, price);
      alert(`🎉 NFT #${tokenId} purchased!`);
      await fetchNFTs();
    } catch (err) {
      const msg = parseContractError(err).message;
      if (!msg.includes('rejected')) alert(msg);
    } finally {
      setBuyingId(null);
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!mintForm.name.trim()) { setMintError('Name is required'); return; }
    setMinting(true);
    setMintError(null);
    setMintSuccess(false);
    try {
      const { tokenId } = await mintNFT(mintForm.name.trim());
      if (mintForm.listPrice && parseFloat(mintForm.listPrice) > 0 && tokenId !== null) {
        await listNFT(tokenId, mintForm.listPrice);
      }
      setMintSuccess(true);
      setMintForm({ name: '', listPrice: '' });
      setTimeout(() => { setMintSuccess(false); setShowMint(false); }, 2500);
      await fetchNFTs();
    } catch (err) {
      const msg = parseContractError(err).message;
      if (!msg.includes('rejected')) setMintError(msg);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="w-7 h-7" /><span>NFT Marketplace</span>
          </h1>
          <p className="text-gray-600 mt-1">Discover, buy, and sell NFTs on Sepolia</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={fetchNFTs} className="btn-secondary flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" /><span>Refresh</span>
          </button>
          {walletAddress && (
            <button onClick={() => setShowMint(true)} className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" /><span>Mint NFT</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <p className="text-primary-700 text-sm">All NFTs are stored on the Sepolia blockchain. Purchases require MetaMask approval.</p>
      </div>

      {/* NFT Grid */}
      <div className="card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading marketplace...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm mb-2">{error}</p>
              <button onClick={fetchNFTs} className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg">Try Again</button>
            </div>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No NFTs Listed</h3>
            <p className="text-gray-500">Be the first to mint and list an NFT!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div key={nft.tokenId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="w-full h-44 bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center relative">
                  <ImageIcon className="w-14 h-14 text-white opacity-40" />
                  {isMyNFT(nft.owner) && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">Yours</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{nft.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">Token #{nft.tokenId}</p>
                  <div className="flex items-center justify-between text-sm mb-2 p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-1 text-gray-500"><User className="w-3 h-3" /><span>Owner</span></div>
                    <span className="font-mono text-xs text-gray-700">{formatAddress(nft.owner)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-primary-50 rounded mb-3">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="font-bold text-gray-900">{parseFloat(nft.priceInEth).toFixed(4)} ETH</span>
                  </div>
                  {isMyNFT(nft.owner) ? (
                    <div className="text-center text-sm text-gray-500 py-2">You own this NFT</div>
                  ) : (
                    <button onClick={() => handleBuy(nft.tokenId, nft.price)}
                      disabled={buyingId === nft.tokenId}
                      className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg font-medium transition-colors ${
                        buyingId === nft.tokenId ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}>
                      {buyingId === nft.tokenId
                        ? <><Loader className="w-4 h-4 animate-spin" /><span>Buying...</span></>
                        : <><ShoppingCart className="w-4 h-4" /><span>Buy Now</span></>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-500">
        Need test ETH?{' '}
        <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Sepolia Faucet</a>
      </p>

      {/* Mint NFT Modal */}
      {showMint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mint New NFT</h3>
              <button onClick={() => { setShowMint(false); setMintError(null); setMintSuccess(false); }}
                className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {mintSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 text-sm font-medium">NFT minted successfully!</p>
              </div>
            )}
            {mintError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{mintError}</p>
              </div>
            )}

            <form onSubmit={handleMint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NFT Name</label>
                <input type="text" value={mintForm.name}
                  onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                  placeholder="My Awesome NFT" className="input-field" disabled={minting} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Price (ETH) — optional</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" step="0.0001" min="0" value={mintForm.listPrice}
                    onChange={(e) => setMintForm({ ...mintForm, listPrice: e.target.value })}
                    placeholder="0.01" className="input-field pl-9" disabled={minting} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty to mint without listing</p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => { setShowMint(false); setMintError(null); }}
                  className="flex-1 btn-secondary" disabled={minting}>Cancel</button>
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center space-x-2" disabled={minting}>
                  {minting ? <><Loader className="w-4 h-4 animate-spin" /><span>Minting...</span></>
                    : <><Sparkles className="w-4 h-4" /><span>Mint</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
