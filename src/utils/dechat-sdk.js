/**
 * DeChat SDK — composite flows on top of contract.js
 *
 * Single-step ops → import directly from contract.js
 * Multi-step / enriched flows → import from here
 */

import { ethers } from 'ethers';
import {
  getContract,
  getContractReadOnly,
  getConnectedAddress,
  createPublicRoom as _createPublicRoom,
  createPrivateRoomWithNFT as _createPrivateRoomWithNFT,
  joinPublicRoom as _joinPublicRoom,
  joinPrivateRoom as _joinPrivateRoom,
  sendRoomMessage as _sendRoomMessage,
  sendPrivateMessage,
  mintNFT,
  listNFT,
  buyNFT as _buyNFT,
  getAllListedNFTs,
  getNFTsByOwner as _getNFTsByOwner,
} from './contract';

// ─── 1. Rooms ─────────────────────────────────────────────────────────────────

export async function createPublicRoom(name) {
  const result = await _createPublicRoom(name);
  console.log('✅ Public room created. ID:', result.roomId);
  return result;
}

/**
 * Create a private room. Pass existingNFTId=0 to auto-mint.
 */
export async function createPrivateRoomWithNFT(roomName, existingNFTId = 0) {
  const result = await _createPrivateRoomWithNFT(roomName, existingNFTId);
  console.log('✅ Private room created. ID:', result.roomId);
  return result;
}

export async function joinPublicRoom(roomId) {
  const result = await _joinPublicRoom(roomId);
  console.log('✅ Joined public room', roomId);
  return result;
}

export async function joinPrivateRoom(roomId) {
  const result = await _joinPrivateRoom(roomId);
  console.log('✅ Joined private room', roomId);
  return result;
}

export async function sendRoomMessage(roomId, message) {
  const result = await _sendRoomMessage(roomId, message);
  console.log('✅ Message sent to room', roomId);
  return result;
}

// ─── 2. Private messages ──────────────────────────────────────────────────────

/**
 * Send a DM. Contacts are saved on-chain automatically by the contract.
 */
export async function sendDirectMessage(toAddress, message) {
  const result = await sendPrivateMessage(toAddress, message);
  console.log('✅ DM sent to', toAddress);
  return result;
}

/**
 * Get private messages between the connected wallet and another address.
 */
export async function getPrivateMessages(otherAddress) {
  if (!ethers.isAddress(otherAddress)) throw new Error('Invalid address.');
  const myAddress = await getConnectedAddress();
  const contract = await getContractReadOnly();
  const messages = await contract.getPrivateMessages(myAddress, otherAddress);
  return messages.map(m => ({
    sender: m.sender,
    content: m.content,
    timestamp: new Date(Number(m.timestamp) * 1000).toISOString(),
  }));
}

// ─── 3. Rooms with message count ──────────────────────────────────────────────

export async function getAllRoomsWithDetails() {
  const contract = await getContractReadOnly();
  const rooms = await contract.getAllRooms();

  return Promise.all(
    rooms.map(async (room) => {
      let messageCount = 0;
      try {
        const msgs = await contract.getRoomMessages(room.id.toString());
        messageCount = msgs.length;
      } catch { /* not a member — skip */ }

      return {
        id: room.id.toString(),
        name: room.name,
        creator: room.creator,
        isPrivate: room.isPrivate,
        createdAt: new Date(Number(room.createdAt) * 1000).toISOString(),
        exists: room.exists,
        messageCount,
      };
    })
  );
}

// ─── 4. NFT Marketplace ───────────────────────────────────────────────────────

export const getListedNFTs = getAllListedNFTs;
export const getNFTsByOwner = _getNFTsByOwner;
export const buyNFT = _buyNFT;

/**
 * Mint an NFT and optionally list it for sale.
 * @param {string}  name
 * @param {string}  metadataURI
 * @param {string?} listPriceEth  e.g. "0.05" — omit to skip listing
 */
export async function mintAndListNFT(name, metadataURI, listPriceEth) {
  const { tokenId, txHash } = await mintNFT(name, metadataURI);
  console.log('✅ NFT minted. Token ID:', tokenId);

  if (listPriceEth) {
    const { txHash: listTxHash } = await listNFT(tokenId, listPriceEth);
    console.log('✅ NFT listed for', listPriceEth, 'ETH');
    return { tokenId, txHash, listTxHash };
  }

  return { tokenId, txHash };
}
