import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// REAL METAMASK: Using real MetaMask wallet
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { ChatProvider } from './contexts/ChatContext';
import { ChatbotProvider } from './contexts/ChatbotContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatRoom from './pages/ChatRoom';
import PrivateChats from './pages/PrivateChats';
import Profile from './pages/Profile';
import About from './pages/About';
import Marketplace from './pages/Marketplace';
import Chatbot from './components/Chatbot/Chatbot';

function AppRoutes() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/room/:roomId" element={<ChatRoom />} />
        <Route path="/private-chats" element={<PrivateChats />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <Chatbot />
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <WalletProvider>
        <ChatProvider>
          <ChatbotProvider>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </ChatbotProvider>
        </ChatProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;