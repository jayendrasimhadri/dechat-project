import React from 'react';
import { 
  MessageSquare, 
  Shield, 
  Zap, 
  Globe, 
  Users, 
  Star,
  Github,
  Twitter,
  ExternalLink
} from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Shield,
      title: 'NFT-Gated Access',
      description: 'Exclusive chat rooms accessible only to verified NFT holders, ensuring premium community experiences.'
    },
    {
      icon: Zap,
      title: 'Real-time Messaging',
      description: 'Lightning-fast messaging powered by decentralized infrastructure for seamless communication.'
    },
    {
      icon: Globe,
      title: 'IPFS Storage',
      description: 'All messages are stored on IPFS, ensuring permanent, decentralized, and censorship-resistant communication.'
    },
    {
      icon: Star,
      title: 'Message NFTs',
      description: 'Transform your memorable messages into unique NFTs, creating lasting digital collectibles.'
    },
    {
      icon: Users,
      title: 'Private Messaging',
      description: 'Secure wallet-to-wallet private conversations with end-to-end encryption.'
    },
    {
      icon: MessageSquare,
      title: 'Community Driven',
      description: 'Built by the community, for the community. Open-source and transparent development.'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+' },
    { label: 'NFT Collections', value: '500+' },
    { label: 'Messages Sent', value: '1M+' },
    { label: 'NFTs Minted', value: '25,000+' }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About DeChat</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          The future of decentralized communication. Connect, chat, and create in NFT-gated communities 
          while maintaining true ownership of your digital conversations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center">
            <p className="text-2xl font-bold text-primary-600 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Built With</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Frontend</h3>
            <p className="text-sm text-gray-600 mt-1">React.js & Tailwind CSS</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Blockchain</h3>
            <p className="text-sm text-gray-600 mt-1">Ethereum & Web3</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Storage</h3>
            <p className="text-sm text-gray-600 mt-1">IPFS Network</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Authentication</h3>
            <p className="text-sm text-gray-600 mt-1">MetaMask Wallet</p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            DeChat represents the next evolution of digital communication. We believe that conversations 
            should be owned by the participants, not controlled by centralized platforms. Our mission is 
            to create a truly decentralized communication platform where:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li>• Users maintain complete ownership of their messages and data</li>
            <li>• Communities can create exclusive spaces based on NFT ownership</li>
            <li>• Memorable conversations can be immortalized as digital collectibles</li>
            <li>• Privacy and security are built into the foundation, not added as an afterthought</li>
            <li>• Innovation is driven by community needs and feedback</li>
          </ul>
        </div>
      </div>

      {/* Roadmap */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Roadmap</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
            <div>
              <h3 className="font-medium text-gray-900">Phase 1: Core Platform (Completed)</h3>
              <p className="text-sm text-gray-600">Basic chat functionality, NFT-gated rooms, wallet authentication</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
            <div>
              <h3 className="font-medium text-gray-900">Phase 2: Enhanced Features (In Progress)</h3>
              <p className="text-sm text-gray-600">Message NFTs, private messaging, mobile app</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-4 h-4 bg-gray-300 rounded-full mt-1"></div>
            <div>
              <h3 className="font-medium text-gray-900">Phase 3: Advanced Features (Planned)</h3>
              <p className="text-sm text-gray-600">Voice/video calls, DAO governance, multi-chain support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Links */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Our Community</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="#"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            <Twitter className="w-4 h-4" />
            <span>Twitter</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discord</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-200">
        <p className="text-gray-600">
          Built with ❤️ by the DeChat community. Open source and decentralized.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          © 2024 DeChat. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default About;