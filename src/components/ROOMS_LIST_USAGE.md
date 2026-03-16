# RoomsList Component Usage

## Overview
The `RoomsList` component fetches and displays all chat rooms from the DeChat smart contract using ethers.js v6.

## Features
- ✅ Fetches rooms from smart contract using `getAllRooms()`
- ✅ Displays room name, creator, and creation date
- ✅ Shows public/private status with icons
- ✅ Loading state with spinner
- ✅ Error handling with retry button
- ✅ Empty state when no rooms exist
- ✅ Refresh functionality
- ✅ Responsive grid layout
- ✅ Clean, production-ready UI

## Usage

### Basic Usage
```jsx
import RoomsList from './components/RoomsList';

function Dashboard() {
  return (
    <div>
      <h1>Chat Rooms</h1>
      <RoomsList />
    </div>
  );
}
```

### In App.js
```jsx
import RoomsList from './components/RoomsList';

function App() {
  return (
    <div className="container mx-auto p-6">
      <RoomsList />
    </div>
  );
}
```

### In Dashboard Page
```jsx
import RoomsList from '../components/RoomsList';

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <RoomsList />
    </div>
  );
}
```

## Component States

### 1. Loading State
- Shows spinner animation
- Displays "Loading chat rooms..." message
- Appears while fetching data from contract

### 2. Error State
- Shows error message in red banner
- Displays "Try Again" button
- Allows user to retry fetching

### 3. Empty State
- Shows when no rooms exist
- Displays empty state icon and message
- Includes refresh button

### 4. Success State
- Displays rooms in responsive grid
- Shows room cards with details
- Includes refresh button in header

## Room Card Information

Each room card displays:
- **Room Name** - The name of the chat room
- **Status Badge** - Public (green) or Private (orange)
- **Creator** - Wallet address in short format (0x1234...abcd)
- **Created Date** - Formatted date (e.g., "Jan 15, 2024")
- **Room ID** - Unique identifier from contract
- **Join Button** - Action button to join the room

## Data Flow

```
Component Mount
    ↓
useEffect Hook
    ↓
fetchRooms()
    ↓
getContractReadOnly()
    ↓
contract.getAllRooms()
    ↓
Transform Data
    ↓
Filter (only existing rooms)
    ↓
Map to display format
    ↓
Update State
    ↓
Render UI
```

## Contract Integration

### Contract Method Used
```solidity
function getAllRooms() external view returns (Room[] memory)
```

### Room Structure
```javascript
{
  id: string,           // Room ID (BigInt converted to string)
  name: string,         // Room name
  creator: string,      // Creator wallet address
  isPrivate: boolean,   // Privacy status
  createdAt: string,    // Timestamp (BigInt converted to string)
  exists: boolean       // Room existence flag
}
```

## Error Handling

### Common Errors

1. **MetaMask Not Installed**
```
Error: "MetaMask is not installed. Please install MetaMask to use this app."
```

2. **Contract Not Configured**
```
Error: "Contract address not configured"
```

3. **Network Error**
```
Error: "Failed to load chat rooms. Please try again."
```

4. **Contract Call Failed**
```
Error: "execution reverted" or specific contract error
```

## Styling

The component uses Tailwind CSS with:
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Card hover effects with shadow
- Color-coded status badges
- Consistent spacing and typography

## Customization

### Modify Grid Layout
```jsx
{/* Change from 3 columns to 4 columns on large screens */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Add Click Handler
```jsx
const handleRoomClick = (roomId) => {
  console.log('Room clicked:', roomId);
  // Navigate to room or open modal
};

<div
  key={room.id}
  onClick={() => handleRoomClick(room.id)}
  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
>
```

### Add Member Count
If your contract has a `getMemberCount(roomId)` function:

```jsx
const [memberCounts, setMemberCounts] = useState({});

const fetchMemberCount = async (roomId) => {
  const contract = await getContractReadOnly();
  const count = await contract.getMemberCount(roomId);
  return count.toString();
};

// In the room card:
<div className="flex items-center space-x-1 text-sm text-gray-600">
  <Users className="w-4 h-4" />
  <span>{memberCounts[room.id] || '0'} members</span>
</div>
```

## Integration with Router

### Navigate to Room on Click
```jsx
import { useNavigate } from 'react-router-dom';

const RoomsList = () => {
  const navigate = useNavigate();

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    // ... in the room card
    <button 
      onClick={() => handleJoinRoom(room.id)}
      className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
    >
      Join Room
    </button>
  );
};
```

## Performance Optimization

### Add Refresh Interval
```jsx
useEffect(() => {
  fetchRooms();
  
  // Auto-refresh every 30 seconds
  const interval = setInterval(fetchRooms, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### Memoize Formatted Data
```jsx
import { useMemo } from 'react';

const formattedRooms = useMemo(() => {
  return rooms.map(room => ({
    ...room,
    formattedCreator: formatAddress(room.creator),
    formattedDate: formatDate(room.createdAt)
  }));
}, [rooms]);
```

## Testing Checklist

- [ ] Component loads without errors
- [ ] Loading spinner appears initially
- [ ] Rooms display after loading
- [ ] Empty state shows when no rooms
- [ ] Error state shows on contract failure
- [ ] Refresh button works
- [ ] Room cards display all information
- [ ] Public/Private badges show correctly
- [ ] Join button is clickable
- [ ] Responsive layout works on mobile/tablet/desktop

## Next Steps

After rooms are displaying:
1. Implement room joining functionality
2. Add room creation modal/page
3. Implement real-time updates (WebSocket or polling)
4. Add search/filter functionality
5. Implement pagination for large room lists
6. Add member count display
7. Implement room deletion (for creators)

## Dependencies

- `ethers` - For contract interaction
- `lucide-react` - For icons
- `react` - Core framework
- Tailwind CSS - For styling

## Related Files

- `src/utils/contract.js` - Contract interaction utilities
- `src/contracts/DeChat.json` - Contract ABI
- `src/contexts/WalletContext.js` - Wallet connection context
