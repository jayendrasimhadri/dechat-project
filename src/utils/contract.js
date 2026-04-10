/**
 * DeChat Contract Layer
 * Ethers.js v6 + MetaMask + Sepolia Testnet
 *
 * Write:
 *  createPublicRoom(name)
 *  createPrivateRoomWithNFT(roomName, existingNFTId)
 *  joinPublicRoom(roomId)
 *  joinPrivateRoom(roomId)
 *  sendRoomMessage(roomId, content)
 *  sendPrivateMessage(toAddress, content)
 *  mintNFT(name, metadataURI)
 *  listNFT(tokenId, priceEth)
 *  buyNFT(tokenId, priceWei)
 *
 * Read:
 *  getRoom(roomId)
 *  getAllRooms()
 *  getRoomMessages(roomId)
 *  getPrivateMessages(user1, user2)
 *  getPrivateContacts(userAddress)
 *  isMember(roomId, address)
 *  getNFT(tokenId)
 *  getAllNFTs()
 *  getNFTsByOwner(ownerAddress?)   ← filters getAllNFTs client-side
 *
 * Helpers:
 *  getContract()          signer instance
 *  getContractReadOnly()  provider instance
 *  getConnectedAddress()
 *  isSepoliaNetwork()
 *  switchToSepolia()
 *  ensureSepolia()
 *  parseContractError(err)
 */

import { ethers } from 'ethers';
import DeChat from '../contracts/DeChat.json';

// ─── Config ───────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x416A0A3839Bcbee98Cf2D5F0f089369648b7B736';
const SEPOLIA_CHAIN_ID = '0xaa36a7';
const HARDHAT_CHAIN_ID = '0x7a69'; // 31337

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install it to use this app.');
  }
}

function getProvider() {
  requireMetaMask();
  return new ethers.BrowserProvider(window.ethereum);
}

export function parseContractError(err) {
  if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
    return new Error('Transaction rejected by user.');
  }

  // MetaMask RPC rate-limiting / endpoint overload
  const rpcMsg = err?.error?.message || err?.info?.error?.message || '';
  if (
    err.code === 'UNKNOWN_ERROR' &&
    (rpcMsg.includes('too many errors') || rpcMsg.includes('RPC endpoint') || err?.error?.code === -32002)
  ) {
    return new Error(
      'Sepolia RPC is overloaded. Please wait 30 seconds and try again, ' +
      'or switch MetaMask to a faster RPC: Settings → Networks → Sepolia → ' +
      'use https://rpc.sepolia.org or a free Alchemy endpoint.'
    );
  }

  if (err.reason) return new Error(err.reason);
  if (err.message) {
    const match = err.message.match(/reason="([^"]+)"/);
    if (match) return new Error(match[1]);
    return new Error(err.message);
  }
  return new Error('Unknown contract error.');
}

async function send(contractFn, args = [], overrides = {}) {
  let gasLimit;
  try {
    const estimated = await contractFn.estimateGas(...args, overrides);
    gasLimit = (estimated * 120n) / 100n;
  } catch (err) {
    throw parseContractError(err);
  }
  try {
    return await contractFn(...args, { ...overrides, gasLimit });
  } catch (err) {
    throw parseContractError(err);
  }
}

// ─── Connection ───────────────────────────────────────────────────────────────

export const getContract = async () => {
  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, DeChat.abi, signer);
};

export const getContractReadOnly = async () => {
  await ensureSepolia(); // ensure MetaMask is on the correct network before any call
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, DeChat.abi, provider);
};

export const getConnectedAddress = async () => {
  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  return signer.getAddress();
};

// ─── Network ──────────────────────────────────────────────────────────────────

export const isSepoliaNetwork = async () => {
  try {
    const network = await getProvider().getNetwork();
    return network.chainId === 11155111n;
  } catch {
    return false;
  }
};

export const isLocalNetwork = async () => {
  try {
    const network = await getProvider().getNetwork();
    return network.chainId === 31337n;
  } catch {
    return false;
  }
};

export const switchToSepolia = async () => {
  requireMetaMask();
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
      return true;
    }
    throw parseContractError(err);
  }
};

export const switchToHardhatLocal = async () => {
  requireMetaMask();
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_CHAIN_ID }],
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: HARDHAT_CHAIN_ID,
          chainName: 'Hardhat Local',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://127.0.0.1:8545'],
          blockExplorerUrls: [],
        }],
      });
      return true;
    }
    throw parseContractError(err);
  }
};

// Addresses generated by a fresh Hardhat node (deterministic)
const HARDHAT_DEFAULT_ADDRESSES = [
  '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
  '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
];

export const isHardhatContract = () =>
  HARDHAT_DEFAULT_ADDRESSES.includes(CONTRACT_ADDRESS.toLowerCase());

export const ensureSepolia = async () => {
  if (isHardhatContract()) {
    // Contract is on local Hardhat node — switch MetaMask there
    const onLocal = await isLocalNetwork();
    if (onLocal) return;
    await switchToHardhatLocal();
  } else {
    // Contract is on Sepolia
    const onSepolia = await isSepoliaNetwork();
    if (onSepolia) return;
    const onLocal = await isLocalNetwork();
    if (onLocal) return;
    await switchToSepolia();
  }
};

export const getContractAddress = () => CONTRACT_ADDRESS;
export const isContractConfigured = () =>
  CONTRACT_ADDRESS !== 'PASTE_MY_DEPLOYED_CONTRACT_ADDRESS';

// ─── Write: Rooms ─────────────────────────────────────────────────────────────

/**
 * Create a public room.
 * @param {string} name  1–100 chars
 * @returns {{ roomId: string, txHash: string }}
 */
export const createPublicRoom = async (name) => {
  if (!name?.trim()) throw new Error('Room name is required.');
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.createPublicRoom, [name.trim()]);
  const receipt = await tx.wait();
  const roomId = _extractEvent(contract, receipt, 'RoomCreated', 'roomId');
  return { roomId, txHash: receipt.hash };
};

/**
 * Create a private room. Pass existingNFTId=0 to auto-mint a new NFT.
 * @param {string}        roomName
 * @param {number|string} existingNFTId  0 = auto-mint
 * @returns {{ roomId: string, txHash: string }}
 */
export const createPrivateRoomWithNFT = async (roomName, existingNFTId = 0) => {
  if (!roomName?.trim()) throw new Error('Room name is required.');
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.createPrivateRoomWithNFT, [roomName.trim(), existingNFTId]);
  const receipt = await tx.wait();
  const roomId = _extractEvent(contract, receipt, 'RoomCreated', 'roomId');
  return { roomId, txHash: receipt.hash };
};

/**
 * Join a public room.
 * @param {number|string} roomId
 */
export const joinPublicRoom = async (roomId) => {
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.joinPublicRoom, [roomId]);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

/**
 * Join a private room. Caller must own the required NFT.
 * @param {number|string} roomId
 */
export const joinPrivateRoom = async (roomId) => {
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.joinPrivateRoom, [roomId]);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

/**
 * Send a message to a room. Caller must be a member.
 * @param {number|string} roomId
 * @param {string}        content  1–1000 chars
 */
export const sendRoomMessage = async (roomId, content) => {
  if (!content?.trim()) throw new Error('Message cannot be empty.');
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.sendRoomMessage, [roomId, content.trim()]);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

// ─── Write: Private messages ──────────────────────────────────────────────────

/**
 * Send a private DM. Automatically saves both parties as contacts on-chain.
 * @param {string} toAddress
 * @param {string} content
 */
export const sendPrivateMessage = async (toAddress, content) => {
  if (!ethers.isAddress(toAddress)) throw new Error('Invalid recipient address.');
  if (!content?.trim()) throw new Error('Message cannot be empty.');
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.sendPrivateMessage, [toAddress, content.trim()]);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

// ─── Write: NFT ───────────────────────────────────────────────────────────────

/**
 * Mint a new NFT.
 * @param {string} name
 * @param {string} metadataURI
 * @returns {{ tokenId: string, txHash: string }}
 */
export const mintNFT = async (name, metadataURI) => {
  if (!name?.trim()) throw new Error('NFT name is required.');
  // Fall back to a placeholder URI if none provided (contract requires non-empty)
  const uri = metadataURI?.trim() || `ipfs://dechat/${encodeURIComponent(name.trim())}`;
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.mintNFT, [name.trim(), uri]);
  const receipt = await tx.wait();
  const tokenId = _extractEvent(contract, receipt, 'NFTMinted', 'tokenId');
  return { tokenId, txHash: receipt.hash };
};

/**
 * List an NFT for sale.
 * @param {number|string} tokenId
 * @param {string}        priceEth  e.g. "0.05"
 */
export const listNFT = async (tokenId, priceEth) => {
  if (!priceEth) throw new Error('Price is required.');
  await ensureSepolia();
  const contract = await getContract();
  const priceWei = ethers.parseEther(priceEth.toString());
  const tx = await send(contract.listNFT, [tokenId, priceWei]);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

/**
 * Purchase a listed NFT.
 * @param {number|string} tokenId
 * @param {string}        priceWei  use nft.priceWei from getNFT / getAllNFTs
 */
export const buyNFT = async (tokenId, priceWei) => {
  await ensureSepolia();
  const contract = await getContract();
  const tx = await send(contract.buyNFT, [tokenId], { value: ethers.toBigInt(priceWei) });
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
};

// ─── Read: Rooms ──────────────────────────────────────────────────────────────

export const getRoom = async (roomId) => {
  const contract = await getContractReadOnly();
  const room = await contract.getRoom(roomId);
  return _formatRoom(room);
};

export const getAllRooms = async () => {
  const contract = await getContractReadOnly();
  const rooms = await contract.getAllRooms();
  return rooms.map(_formatRoom);
};

/**
 * Get all messages in a room. Caller must be a member.
 * @param {number|string} roomId
 */
export const getRoomMessages = async (roomId) => {
  // Try with signer first (passes msg.sender for onlyMember checks).
  // Fall back to read-only if signer call fails.
  try {
    const contract = await getContract();
    const messages = await contract.getRoomMessages(roomId);
    return messages.map(_formatMessage);
  } catch (_) {
    const contract = await getContractReadOnly();
    const messages = await contract.getRoomMessages(roomId);
    return messages.map(_formatMessage);
  }
};

export const isMember = async (roomId, address) => {
  const contract = await getContractReadOnly();
  return contract.isMember(roomId, address);
};

/**
 * Get the NFT token ID required to join a private room.
 * Returns the token ID as a number, or null for public rooms.
 */
export const getRoomRequiredNFT = async (roomId) => {
  const contract = await getContractReadOnly();
  const tokenId = await contract.roomRequiredNFT(roomId);
  return Number(tokenId);
};

// ─── Read: Private messages & contacts ───────────────────────────────────────

/**
 * Fetch saved contacts for a wallet directly from the contract.
 * Returns after every sendPrivateMessage call automatically.
 * @param {string} userAddress
 * @returns {string[]}  array of contact addresses
 */
export const getPrivateContacts = async (userAddress) => {
  if (!ethers.isAddress(userAddress)) throw new Error('Invalid address.');
  const contract = await getContractReadOnly();
  const contacts = await contract.getPrivateContacts(userAddress);
  return [...contacts]; // convert ethers Result to plain array
};

/**
 * Get private messages between two addresses.
 * @param {string} user1
 * @param {string} user2
 */
export const getPrivateMessages = async (user1, user2) => {
  const contract = await getContractReadOnly();
  const messages = await contract.getPrivateMessages(user1, user2);
  return messages.map(_formatMessage);
};

// ─── Read: NFT ────────────────────────────────────────────────────────────────

export const getNFT = async (tokenId) => {
  const contract = await getContractReadOnly();
  const nft = await contract.getNFT(tokenId);
  return _formatNFT(nft);
};

/**
 * Get every NFT ever minted (listed and unlisted).
 */
export const getAllNFTs = async () => {
  const contract = await getContractReadOnly();
  const nfts = await contract.getAllNFTs();
  return nfts.map(_formatNFT);
};

/**
 * Get only listed NFTs (filtered client-side from getAllNFTs).
 */
export const getAllListedNFTs = async () => {
  const all = await getAllNFTs();
  return all.filter(n => n.isListed);
};

/**
 * Get NFTs owned by an address (filtered client-side from getAllNFTs).
 * Defaults to connected wallet if ownerAddress is omitted.
 */
export const getNFTsByOwner = async (ownerAddress) => {
  const address = ownerAddress ?? await getConnectedAddress();
  if (!ethers.isAddress(address)) throw new Error('Invalid address.');
  const all = await getAllNFTs();
  return all.filter(n => n.owner.toLowerCase() === address.toLowerCase());
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function _formatRoom(r) {
  return {
    id: r.id.toString(),
    name: r.name,
    creator: r.creator,
    isPrivate: r.isPrivate,
    createdAt: new Date(Number(r.createdAt) * 1000).toISOString(),
    exists: r.exists,
  };
}

function _formatMessage(m) {
  return {
    sender: m.sender,
    content: m.content,
    timestamp: new Date(Number(m.timestamp) * 1000).toISOString(),
  };
}

function _formatNFT(n) {
  return {
    tokenId: n.tokenId.toString(),
    owner: n.owner,
    name: n.name,
    metadataURI: n.metadataURI,
    priceWei: n.price.toString(),
    priceEth: ethers.formatEther(n.price),
    isListed: n.isListed,
  };
}

function _extractEvent(contract, receipt, eventName, argName) {
  try {
    for (const log of receipt.logs) {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) return parsed.args[argName]?.toString();
    }
  } catch { /* unrelated logs */ }
  return null;
}
