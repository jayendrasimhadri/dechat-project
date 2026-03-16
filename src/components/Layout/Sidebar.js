import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  MessageCircle, 
  User, 
  Info,
  Wallet
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/marketplace', icon: MessageSquare, label: 'Marketplace' },
    { to: '/private-chats', icon: MessageCircle, label: 'Private Chats' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/about', icon: Info, label: 'About' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DeChat</h1>
            <p className="text-sm text-gray-500">Decentralized Chat</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Wallet className="w-4 h-4" />
          <span>Wallet Connected</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;