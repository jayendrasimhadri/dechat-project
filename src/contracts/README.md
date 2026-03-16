# 📄 Smart Contract ABI

This folder contains the ABI (Application Binary Interface) for the deployed DeChat smart contract.

## 📁 Files

- **`DeChat.json`** - Complete ABI for the DeChat contract

## 🔧 Usage in React

### Import the ABI:

```javascript
import DeChat from '../contracts/DeChat.json';
```

### Use with ethers.js:

```javascript
import { ethers } from 'ethers';
import DeChat from '../contracts/DeChat.json';

// Get contract instance
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const contract = new ethers.Contract(
  contractAddress,
  DeChat.abi,
  signer
);

// Call contract functions
const rooms = await contract.getAllRooms();
const nfts = await contract.getAllListedNFTs();
```

## 📊 Contract Functions

### Room Management:
- `createRoom(name, isPrivate)`
- `getRoom(roomId)`
- `getAllRooms()`
- `deleteRoom(roomId)`
- `joinRoom(roomId)`
- `addMember(roomId, user)`

### Messaging:
- `sendMessage(roomId, content)`
- `getMessages(roomId)`
- `sendPrivateMessage(to, content)`
- `getPrivateMessages(user1, user2)`

### NFT Marketplace:
- `mintNFT(name, metadataURI)`
- `listNFT(tokenId, price)`
- `buyNFT(tokenId)`
- `getAllListedNFTs()`
- `getNFT(tokenId)`
- `getNFTsByOwner(owner)`

## 🎭 Events

- `RoomCreated`
- `RoomDeleted`
- `MemberJoined`
- `MessageSent`
- `PrivateMessageSent`
- `NFTMinted`
- `NFTListed`
- `NFTPurchased`

## ✅ ABI Status

- ✅ Valid JSON format
- ✅ Complete function definitions
- ✅ All events included
- ✅ View functions included
- ✅ Ready for import

## 🚀 Next Steps

1. Add your deployed contract address
2. Import the ABI in your components
3. Create contract instance with ethers.js
4. Call contract functions

**Your ABI is ready to use!** 🎉
