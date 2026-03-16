# 🔗 DeChat Blockchain Layer

Smart contract layer for decentralized chat application.

## 📋 Overview

This smart contract stores **IPFS CIDs** (Content Identifiers) on the blockchain, not the actual messages. This approach provides:

- ✅ **Integrity** - Immutable message history
- ✅ **Verification** - Cryptographic proof of messages
- ✅ **Cost-effective** - Only storing hashes, not full content
- ✅ **Decentralized** - No central authority

---

## 🚀 Quick Start

### 1. Compile Contract

```bash
npx hardhat compile
```

### 2. Run Tests

```bash
npx hardhat test
```

### 3. Start Local Blockchain

```bash
npx hardhat node
```

### 4. Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📁 Structure

```
blockchain/
├── contracts/
│   └── Chat.sol              # Main smart contract
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── Chat.test.js          # Contract tests
├── hardhat.config.js         # Hardhat configuration
└── package.json              # Dependencies
```

---

## 📝 Smart Contract Functions

### `sendMessage(string memory _ipfsCID)`
- Stores IPFS CID on blockchain
- Records sender address
- Records timestamp
- Emits `MessageSent` event

### `getMessagesCount()`
- Returns total number of messages
- View function (no gas cost)

### `getMessage(uint256 index)`
- Returns message data by index
- Returns: (sender, ipfsCID, timestamp)
- View function (no gas cost)

---

## 🧪 Testing

Run all tests:
```bash
npx hardhat test
```

Run with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

Run specific test:
```bash
npx hardhat test --grep "Should send a message"
```

---

## 🌐 Networks

### Local Development
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet
1. Get test ETH from https://sepoliafaucet.com
2. Update `hardhat.config.js` with your Infura key
3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 💰 Gas Costs

### Estimated Costs:

| Operation | Local | Sepolia | Mainnet |
|-----------|-------|---------|---------|
| Deploy | FREE | ~$0 | ~$50-100 |
| Send Message | FREE | ~$0 | ~$5-20 |
| Read Message | FREE | FREE | FREE |

---

## 🔗 Integration with Frontend

After deployment, the contract address and ABI are automatically saved to:
- `../src/contracts/contractAddress.json`
- `../src/contracts/Chat.json`

Use these files in your React app to interact with the contract.

---

## 📊 Architecture

```
Message Flow:
1. User sends message
2. Upload to IPFS → Get CID
3. Store CID on blockchain
4. Blockchain records:
   - Sender address
   - IPFS CID
   - Timestamp
5. Emit event
6. Frontend listens and displays
```

---

## 🛠️ Development

### Clean artifacts:
```bash
npx hardhat clean
```

### Compile:
```bash
npx hardhat compile
```

### Run node:
```bash
npx hardhat node
```

### Deploy:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

## ✅ Next Steps

1. ✅ Compile contract
2. ✅ Run tests
3. ✅ Deploy locally
4. ✅ Integrate with frontend
5. ✅ Test end-to-end
6. ✅ Deploy to testnet

---

**Ready to build decentralized chat on blockchain!** 🚀
