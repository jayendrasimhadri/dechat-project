const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store messages temporarily (in production, use a database)
const messages = {};
const chatRooms = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: io.engine.clientsCount });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins with their wallet address
  socket.on('join', (walletAddress) => {
    socket.walletAddress = walletAddress;
    socket.join(walletAddress);
    console.log(`User ${walletAddress} joined`);
    
    // Send confirmation
    socket.emit('joined', { walletAddress });
  });

  // Create or join a private chat
  socket.on('join-chat', ({ chatId, participants }) => {
    socket.join(chatId);
    console.log(`✅ User ${socket.id} joined room: ${chatId}`);
    
    // Initialize chat if it doesn't exist
    if (!chatRooms[chatId]) {
      chatRooms[chatId] = {
        id: chatId,
        participants: participants,
        createdAt: new Date()
      };
      messages[chatId] = [];
      console.log(`📂 Created new chat room: ${chatId}`);
    }
    
    // Send existing messages to the user
    socket.emit('chat-history', {
      chatId,
      messages: messages[chatId] || []
    });
  });

  // Handle private message
  socket.on('private-message', (data) => {
    console.log('📥 Server received message:', data);
    
    const { id, chatId, sender, receiver, content, timestamp } = data;
    
    console.log(`💬 Broadcasting to room ${chatId}: "${content}" from ${sender}`);
    console.log(`📡 Message ID: ${id}`);
    console.log(`📡 Room ${chatId} has ${io.sockets.adapter.rooms.get(chatId)?.size || 0} members`);
    
    // Broadcast to all users in this chat room
    io.to(chatId).emit('receiveMessage', {
      id,
      chatId,
      sender,
      receiver,
      content,
      timestamp
    });
    
    console.log(`✅ Message broadcasted to room: ${chatId}`);
  });

  // Handle message deletion
  socket.on('delete-message', (data) => {
    const { chatId, messageId, deleteType } = data;
    
    if (messages[chatId]) {
      messages[chatId] = messages[chatId].map(msg => {
        if (msg.id === messageId) {
          if (deleteType === 'forEveryone') {
            return {
              ...msg,
              deletedForEveryone: true,
              content: 'This message was deleted'
            };
          }
        }
        return msg;
      });
      
      // Broadcast deletion to all users in chat
      io.to(chatId).emit('message-deleted', {
        chatId,
        messageId,
        deleteType
      });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ chatId, walletAddress }) => {
    socket.to(chatId).emit('user-typing', {
      chatId,
      walletAddress
    });
  });

  socket.on('stop-typing', ({ chatId, walletAddress }) => {
    socket.to(chatId).emit('user-stop-typing', {
      chatId,
      walletAddress
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 Ready to accept connections from http://localhost:3000`);
});
