# 🚀 DeChat - Decentralized Web3 Messaging Platform

A fully decentralized messaging application built on Ethereum with IPFS storage, NFT-gated rooms, and smart contract-based message coordination.

## 🎯 Features

- ✅ **MetaMask Authentication** - Real wallet connection
- ✅ **Smart Contract Rooms** - Decentralized room management on Sepolia
- ✅ **IPFS Message Storage** - Permanent, decentralized message storage
- ✅ **NFT-Gated Rooms** - Restrict access to NFT holders
- ✅ **Real-time Sync** - Blockchain polling + event listeners
- ✅ **NFT Display** - Show user's NFT collection
- ✅ **Private Chats** - Wallet-to-wallet messaging
- ✅ **Event-Driven** - Listen to blockchain events

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend                          │
│  - MetaMask Authentication                               │
│  - NFT Display & Verification                            │
│  - Room Management UI                                    │
│  - Message Sending/Receiving                             │
└──────────┬──────────────────────────────┬───────────────┘
           │                              │
           ↓                              ↓
┌──────────────────┐          ┌──────────────────┐
│  Smart Contract  │          │  IPFS Network    │
│  (Sepolia)       │          │  (Pinata)        │
│                  │          │                  │
│  - Room storage  │          │  - Message       │
│  - IPFS hashes   │          │    content       │
│  - NFT gating    │          │  - Permanent     │
│  - Access control│          │    storage       │
└──────────────────┘          └──────────────────┘
```

## 📦 Tech Stack

### Frontend
- React 18
- ethers.js v6
- Tailwind CSS
- date-fns
- lucide-react (icons)

### Blockchain
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Sepolia Testnet

### Storage
- IPFS (Pinata)
- Smart Contract (on-chain hashes)

## 🚀 Quick Start

### Prerequisites

1. **Node.js** v16+ and npm
2. **MetaMask** browser extension
3. **Sepolia ETH** (from faucets)
4. **Pinata Account** (for IPFS)
5. **Alchemy Account** (for NFT API - optional)

### Installation

```bash
# Clone repository
git clone <your-repo>
cd de-Chat

# Install frontend dependencies
npm install

# Install blockchain dependencies
cd blockchain
npm install
cd ..
```

### Configuration

1. **Configure Pinata (IPFS):**
   - Edit `src/utils/ipfs.js`
   - Add your Pinata API key and secret

2. **Configure Blockchain:**
   ```bash
   cd blockchain
   cp .env.example .env
   # Edit .env and add:
   # - SEPOLIA_RPC_URL
   # - PRIVATE_KEY
   # - ETHERSCAN_API_KEY
   ```

3. **Configure Alchemy (Optional - for NFT display):**
   - Create `.env` in root
   - Add: `REACT_APP_ALCHEMY_API_KEY=your_key`

### Deploy Smart Contract

```bash
cd blockchain

# Compile contract
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy-rooms.js --network sepolia

# Contract address and ABI will be saved to src/contracts/
```

### Run Application

```bash
# Start React app
npm start

# App opens at http://localhost:3000
```

## 📖 Usage Guide

### 1. Connect Wallet
- Click "Connect MetaMask"
- Approve connection
- Switch to Sepolia testnet if needed

### 2. Create a Room
- Go to "Rooms" page
- Click "Create Room"
- Enter room name
- Optional: Enable NFT gating
- Confirm transaction in MetaMask

### 3. Join a Room
- Browse available rooms
- Click "Join Room"
- If NFT-gated, ownership will be verified
- Confirm transaction

### 4. Send Messages
- Select a room
- Type your message
- Click "Send"
- Message uploads to IPFS
- Hash stored on blockchain
- Other users see message within 5 seconds

### 5. Private Chat
- Go to "Private Chats"
- Click "+" to create chat
- Enter wallet address
- Send messages (same flow as rooms)

## 🔧 Development

### Project Structure

```
de-Chat/
├── blockchain/
│   ├── contracts/
│   │   └── DechatRooms.sol
│   ├── scripts/
│   │   └── deploy-rooms.js
│   ├── test/
│   ├── hardhat.config.js
│   └── .env
├── src/
│   ├── components/
│   │   ├── UserNFTDisplay.jsx
│   │   └── NFTGateCheck.jsx
│   ├── contexts/
│   │   ├── WalletContext.js
│   │   └── ChatContext.js
│   ├── contracts/
│   │   ├── DechatRooms.json
│   │   └── DechatRooms-address.json
│   ├── utils/
│   │   ├── contract.js
│   │   ├── ipfs.js
│   │   ├── nft.js
│   │   └── events.js
│   └── pages/
│       └── PrivateChats.js
└── package.json
```

### Smart Contract Functions

```solidity
// Create a room
createRoom(string name, bool isNFTGated, address nftContract)

// Join a room
joinRoom(uint256 roomId)

// Add message hash
addMessage(uint256 roomId, string ipfsHash)

// Get messages
getRoomMessages(uint256 roomId) returns (string[])

// Get room details
getRoom(uint256 roomId) returns (Room)

// Check access
canJoinRoom(uint256 roomId, address user) returns (bool)
```

### Events

```solidity
event RoomCreated(uint256 roomId, string name, address creator, bool isNFTGated, address nftContract)
event MessageAdded(uint256 roomId, string ipfsHash, address sender, uint256 timestamp)
event MemberJoined(uint256 roomId, address member, uint256 timestamp)
event MemberLeft(uint256 roomId, address member, uint256 timestamp)
```

## ⛽ Gas Costs (Sepolia)

| Function | Estimated Gas | USD (at $2000 ETH) |
|----------|--------------|-------------------|
| createRoom | ~200,000 | ~$0.80 |
| joinRoom | ~80,000 | ~$0.32 |
| addMessage | ~60,000 | ~$0.24 |
| getRoomMessages | 0 (view) | $0 |

## 🔒 Security

- ✅ ReentrancyGuard on state-changing functions
- ✅ Access control modifiers
- ✅ Input validation
- ✅ Event emission for transparency
- ✅ OpenZeppelin audited contracts
- ⚠️ Messages on IPFS are public (consider encryption)

## 🧪 Testing

```bash
cd blockchain

# Run tests
npx hardhat test

# Check contract size
npx hardhat size-contracts

# Run coverage
npx hardhat coverage
```

## 📝 Environment Variables

### Frontend (.env)
```env
REACT_APP_ALCHEMY_API_KEY=your_alchemy_key
```

### Blockchain (blockchain/.env)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🌐 Deployment

### Testnet (Sepolia)
```bash
cd blockchain
npx hardhat run scripts/deploy-rooms.js --network sepolia
```

### Mainnet (when ready)
```bash
cd blockchain
npx hardhat run scripts/deploy-rooms.js --network mainnet
```

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Sepolia Faucet](https://sepoliafaucet.com/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for development environment
- Pinata for IPFS pinning service
- Alchemy for NFT API

## 📞 Support

- Documentation: See `/blockchain/SEPOLIA_DEPLOYMENT.md`
- Implementation Guide: See `/IMPLEMENTATION_GUIDE.md`
- Issues: Open a GitHub issue

---

Built with ❤️ using Web3 technologies
