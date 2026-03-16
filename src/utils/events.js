/**
 * DeChat Event Listeners
 * Matches the actual DeChat.sol event signatures:
 *   RoomCreated(uint256 roomId, address creator, string name, bool isPrivate)
 *   MemberJoined(uint256 roomId, address user)
 *   MessageSent(uint256 roomId, address sender, string content, uint256 timestamp)
 *   PrivateMessageSent(address from, address to, string content, uint256 timestamp)
 *   NFTMinted(uint256 tokenId, address owner, string name)
 *   NFTListed(uint256 tokenId, address owner, uint256 price)
 *   NFTPurchased(uint256 tokenId, address buyer, address seller, uint256 price)
 */

import { getContractReadOnly } from './contract';

// ─── Room events ─────────────────────────────────────────────────────────────

/**
 * Listen for new rooms being created.
 * @param {Function} callback  ({ roomId, creator, name, isPrivate }) => void
 * @returns {Function} unsubscribe
 */
export const onRoomCreated = async (callback) => {
  const contract = await getContractReadOnly();
  const listener = (roomId, creator, name, isPrivate) => {
    callback({ roomId: roomId.toString(), creator, name, isPrivate });
  };
  contract.on('RoomCreated', listener);
  return () => { try { contract.off('RoomCreated', listener); } catch (_) {} };
};

/**
 * Listen for members joining a room.
 * @param {number|string|null} roomId  Pass null to listen to all rooms
 * @param {Function}           callback  ({ roomId, user }) => void
 * @returns {Function} unsubscribe
 */
export const onMemberJoined = async (roomId, callback) => {
  const contract = await getContractReadOnly();
  const filter = roomId != null
    ? contract.filters.MemberJoined(roomId)
    : contract.filters.MemberJoined();
  const listener = (evtRoomId, user) => {
    callback({ roomId: evtRoomId.toString(), user });
  };
  contract.on(filter, listener);
  return () => { try { contract.off(filter, listener); } catch (_) {} };
};

// ─── Message events ───────────────────────────────────────────────────────────

/**
 * Listen for messages sent in a room.
 * @param {number|string|null} roomId  Pass null to listen to all rooms
 * @param {Function}           callback  ({ roomId, sender, content, timestamp }) => void
 * @returns {Function} unsubscribe
 */
export const onMessageSent = async (roomId, callback) => {
  const contract = await getContractReadOnly();
  const filter = roomId != null
    ? contract.filters.MessageSent(roomId)
    : contract.filters.MessageSent();
  const listener = (evtRoomId, sender, content, timestamp) => {
    callback({
      roomId: evtRoomId.toString(),
      sender,
      content,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
    });
  };
  contract.on(filter, listener);
  return () => { try { contract.off(filter, listener); } catch (_) {} };
};

/**
 * Listen for private (wallet-to-wallet) messages.
 * @param {string}   myAddress  Only fires for messages involving this address
 * @param {Function} callback   ({ from, to, content, timestamp }) => void
 * @returns {Function} unsubscribe
 */
export const onPrivateMessageSent = async (myAddress, callback) => {
  const contract = await getContractReadOnly();
  const listener = (from, to, content, timestamp) => {
    const lower = myAddress.toLowerCase();
    if (from.toLowerCase() !== lower && to.toLowerCase() !== lower) return;
    callback({
      from,
      to,
      content,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
    });
  };
  contract.on('PrivateMessageSent', listener);
  return () => { try { contract.off('PrivateMessageSent', listener); } catch (_) {} };
};

// ─── NFT events ───────────────────────────────────────────────────────────────

/**
 * Listen for NFTs being minted.
 * @param {Function} callback  ({ tokenId, owner, name }) => void
 * @returns {Function} unsubscribe
 */
export const onNFTMinted = async (callback) => {
  const contract = await getContractReadOnly();
  const listener = (tokenId, owner, name) => {
    callback({ tokenId: tokenId.toString(), owner, name });
  };
  contract.on('NFTMinted', listener);
  return () => { try { contract.off('NFTMinted', listener); } catch (_) {} };
};

/**
 * Listen for NFTs being listed for sale.
 * @param {Function} callback  ({ tokenId, owner, priceWei, priceEth }) => void
 * @returns {Function} unsubscribe
 */
export const onNFTListed = async (callback) => {
  const contract = await getContractReadOnly();
  const { ethers } = await import('ethers');
  const listener = (tokenId, owner, price) => {
    callback({
      tokenId: tokenId.toString(),
      owner,
      priceWei: price.toString(),
      priceEth: ethers.formatEther(price),
    });
  };
  contract.on('NFTListed', listener);
  return () => { try { contract.off('NFTListed', listener); } catch (_) {} };
};

/**
 * Listen for NFT purchases.
 * @param {Function} callback  ({ tokenId, buyer, seller, priceWei, priceEth }) => void
 * @returns {Function} unsubscribe
 */
export const onNFTPurchased = async (callback) => {
  const contract = await getContractReadOnly();
  const { ethers } = await import('ethers');
  const listener = (tokenId, buyer, seller, price) => {
    callback({
      tokenId: tokenId.toString(),
      buyer,
      seller,
      priceWei: price.toString(),
      priceEth: ethers.formatEther(price),
    });
  };
  contract.on('NFTPurchased', listener);
  return () => { try { contract.off('NFTPurchased', listener); } catch (_) {} };
};

// ─── Convenience: remove all listeners ───────────────────────────────────────

export const removeAllListeners = async () => {
  const contract = await getContractReadOnly();
  contract.removeAllListeners();
};
