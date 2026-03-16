# WalletConnect Component Usage

## Overview
The `WalletConnect` component provides a complete wallet connection interface with MetaMask integration and Sepolia network validation.

## Features
- ✅ Connect to MetaMask wallet
- ✅ Display connected wallet address (formatted: 0x1234...abcd)
- ✅ Sepolia testnet validation (chainId: 11155111 / 0xaa36a7)
- ✅ Network error display with switch button
- ✅ Disconnect wallet functionality
- ✅ Auto-reconnect on page reload
- ✅ Account change detection
- ✅ Network change detection

## Usage Examples

### 1. Full Version (Default)
```jsx
import WalletConnect from '../components/WalletConnect';

function MyPage() {
  return (
    <div>
      <WalletConnect />
    </div>
  );
}
```

### 2. Compact Version (for headers/navbars)
```jsx
import WalletConnect from '../components/WalletConnect';

function Header() {
  return (
    <header>
      <WalletConnect compact={true} />
    </header>
  );
}
```

### 3. Without Network Status
```jsx
<WalletConnect showNetworkStatus={false} />
```

### 4. Without Disconnect Button
```jsx
<WalletConnect showDisconnect={false} />
```

### 5. Minimal Version
```jsx
<WalletConnect 
  compact={true}
  showNetworkStatus={false}
  showDisconnect={false}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showNetworkStatus` | boolean | `true` | Show network status indicator |
| `showDisconnect` | boolean | `true` | Show disconnect button |
| `compact` | boolean | `false` | Use compact horizontal layout |

## States

### Not Connected
- Shows "Connect MetaMask" button
- Displays error messages if connection fails

### Connected - Wrong Network
- Shows yellow warning banner
- Displays "Switch to Sepolia Testnet" button
- Still shows wallet address

### Connected - Correct Network (Sepolia)
- Shows green network indicator
- Displays wallet address
- Shows disconnect button

## Integration Points

### Already Integrated In:
1. **Login Page** (`src/pages/Login.js`)
   - Full version with network validation
   - Error handling for MetaMask not installed

2. **Header Component** (`src/components/Layout/Header.js`)
   - Shows wallet address
   - Network status indicator
   - Quick switch network button
   - Disconnect option

### Where to Use:
- Profile pages
- Settings pages
- Any page requiring wallet connection
- Modal dialogs for transactions

## Wallet Context Functions

The component uses `WalletContext` which provides:

```javascript
const {
  account,              // Connected wallet address
  chainId,              // Current network chain ID
  isConnected,          // Connection status
  isConnecting,         // Loading state
  error,                // Connection errors
  networkError,         // Network validation errors
  connectWallet,        // Function to connect
  disconnectWallet,     // Function to disconnect
  switchToSepolia,      // Function to switch network
  formatAddress         // Utility to format address
} = useWallet();
```

## Network Detection

### Sepolia Testnet
- Chain ID (hex): `0xaa36a7`
- Chain ID (decimal): `11155111`
- RPC URL: `https://rpc.sepolia.org`
- Explorer: `https://sepolia.etherscan.io`

### Supported Networks Display
- Sepolia (0xaa36a7) - Primary
- Ethereum Mainnet (0x1)
- Polygon (0x89)
- Optimism (0xa)
- Arbitrum (0xa4b1)

## Error Handling

### MetaMask Not Installed
```
Error: "MetaMask is not installed. Please install MetaMask to continue."
```

### Wrong Network
```
Network Error: "Please switch to Sepolia testnet to use DeChat."
```

### No Accounts
```
Error: "No accounts found. Please unlock MetaMask."
```

## Styling

The component uses Tailwind CSS classes and follows the app's design system:
- Primary color: `primary-600`
- Success: `green-*`
- Warning: `yellow-*`
- Error: `red-*`
- Neutral: `gray-*`

## Example: Custom Implementation

If you need custom behavior, use the wallet context directly:

```jsx
import { useWallet } from '../contexts/WalletContext';

function CustomWalletButton() {
  const { 
    isConnected, 
    account, 
    connectWallet, 
    formatAddress 
  } = useWallet();

  if (!isConnected) {
    return (
      <button onClick={connectWallet}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div>
      Connected: {formatAddress(account)}
    </div>
  );
}
```

## Testing

### Test Scenarios:
1. ✅ Connect with MetaMask installed
2. ✅ Try to connect without MetaMask
3. ✅ Connect on wrong network
4. ✅ Switch to Sepolia network
5. ✅ Disconnect wallet
6. ✅ Reload page (auto-reconnect)
7. ✅ Change account in MetaMask
8. ✅ Change network in MetaMask

## Next Steps

After wallet connection is working:
1. Deploy smart contract to Sepolia
2. Update `CONTRACT_ADDRESS` in `src/utils/contract.js`
3. Test contract interactions
4. Implement chat room creation
5. Implement messaging functionality
