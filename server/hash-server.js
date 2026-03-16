const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for IPFS hashes
const messageStore = {}; // { chatId: [hash1, hash2, ...] }

// POST /messages - Store IPFS hash for a chat
app.post('/messages', (req, res) => {
  const { chatId, ipfsHash } = req.body;
  
  console.log(`📥 Received hash for chat ${chatId}:`, ipfsHash);
  
  if (!chatId || !ipfsHash) {
    return res.status(400).json({ error: 'chatId and ipfsHash are required' });
  }
  
  if (!messageStore[chatId]) {
    messageStore[chatId] = [];
  }
  
  // Avoid duplicates
  if (!messageStore[chatId].includes(ipfsHash)) {
    messageStore[chatId].push(ipfsHash);
    console.log(`✅ Hash stored. Total for ${chatId}:`, messageStore[chatId].length);
  }
  
  res.json({ success: true, totalHashes: messageStore[chatId].length });
});

// GET /messages/:chatId - Get all IPFS hashes for a chat
app.get('/messages/:chatId', (req, res) => {
  const { chatId } = req.params;
  
  const hashes = messageStore[chatId] || [];
  console.log(`📤 Sending ${hashes.length} hashes for chat ${chatId}`);
  
  res.json(hashes);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    totalChats: Object.keys(messageStore).length,
    totalHashes: Object.values(messageStore).reduce((sum, arr) => sum + arr.length, 0)
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Hash server running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/messages`);
  console.log(`   GET  http://localhost:${PORT}/messages/:chatId`);
});
