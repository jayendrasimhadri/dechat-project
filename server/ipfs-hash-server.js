const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for IPFS hashes (use database in production)
const chatHashes = {};

// Get all IPFS hashes for a chat
app.get('/api/chats/:chatId/hashes', (req, res) => {
  const { chatId } = req.params;
  const hashes = chatHashes[chatId] || [];
  console.log(`📥 GET hashes for ${chatId}:`, hashes.length, 'hashes');
  res.json({ hashes });
});

// Add a new IPFS hash to a chat
app.post('/api/chats/:chatId/hashes', (req, res) => {
  const { chatId } = req.params;
  const { ipfsHash } = req.body;
  
  if (!ipfsHash) {
    return res.status(400).json({ error: 'ipfsHash is required' });
  }
  
  if (!chatHashes[chatId]) {
    chatHashes[chatId] = [];
  }
  
  // Avoid duplicates
  if (!chatHashes[chatId].includes(ipfsHash)) {
    chatHashes[chatId].push(ipfsHash);
    console.log(`📤 Added hash to ${chatId}:`, ipfsHash);
  }
  
  res.json({ success: true, totalHashes: chatHashes[chatId].length });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    totalChats: Object.keys(chatHashes).length,
    totalHashes: Object.values(chatHashes).reduce((sum, arr) => sum + arr.length, 0)
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 IPFS Hash Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/chats/:chatId/hashes`);
});
