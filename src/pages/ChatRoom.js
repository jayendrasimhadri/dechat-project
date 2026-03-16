import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoom, getAllRooms, sendRoomMessage, getRoomMessages, joinPublicRoom, joinPrivateRoom, isMember, parseContractError } from '../utils/contract';
import { onMessageSent } from '../utils/events';
import { useWallet } from '../contexts/WalletContext';
import {
  Send, ArrowLeft, Users, Hash, Loader, AlertCircle, Lock, Globe, CheckCircle
} from 'lucide-react';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { walletAddress } = useWallet();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const messagesEndRef = useRef(null);
  const eventListenerRef = useRef(null);

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const formatTime = (ts) => {
    try { return new Date(Number(ts) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };
  const formatDate = (ts) => {
    try { return new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return 'Unknown'; }
  };
  const isOwnMessage = (sender) => walletAddress && sender?.toLowerCase() === walletAddress.toLowerCase();
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchRoomData = async () => {
    try {
      let roomData = null;

      // Try getRoom first; fall back to scanning getAllRooms if it reverts
      try {
        roomData = await getRoom(roomId);
      } catch (_) {
        const allRooms = await getAllRooms();
        roomData = allRooms.find(r => String(r.id) === String(roomId)) || null;
      }

      if (!roomData?.exists) { setError('Room not found'); return null; }
      const r = {
        id: Number(roomData.id),
        name: roomData.name,
        creator: roomData.creator,
        isPrivate: roomData.isPrivate,
        createdAt: new Date(roomData.createdAt).getTime() / 1000,
        exists: true
      };
      setRoom(r);
      return r;
    } catch (err) {
      setError(parseContractError(err).message);
      return null;
    }
  };

  const fetchMessages = async () => {
    try {
      const rawMsgs = await getRoomMessages(roomId);
      setMessages(rawMsgs.map((msg, i) => ({
        id: i, sender: msg.sender, content: msg.content,
        timestamp: new Date(msg.timestamp).getTime() / 1000
      })));
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      // Not a member or no messages — show empty, don't block the UI
      console.warn('Could not fetch messages:', parseContractError(err).message);
      setMessages([]);
    }
  };

  const initializeRoom = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);

    console.log('[ChatRoom] roomId:', roomId);
    console.log('[ChatRoom] wallet:', walletAddress);

    const roomData = await fetchRoomData();
    if (!roomData) { setLoading(false); return; }

    // Check membership — if not a member, join automatically
    try {
      const alreadyMember = await isMember(roomId, walletAddress);
      console.log('[ChatRoom] isMember:', alreadyMember);

      if (!alreadyMember) {
        setJoining(true);
        try {
          if (roomData.isPrivate) {
            console.log('[ChatRoom] joining private room...');
            await joinPrivateRoom(roomId);
          } else {
            console.log('[ChatRoom] joining public room...');
            await joinPublicRoom(roomId);
          }
          console.log('[ChatRoom] join successful');
        } catch (joinErr) {
          const msg = parseContractError(joinErr).message;
          console.warn('[ChatRoom] join error:', msg);
          // "Already a member" is fine — contract may have thrown if race condition
          if (!msg.toLowerCase().includes('already')) {
            setError(roomData.isPrivate
              ? `Cannot join private room: ${msg}`
              : `Cannot join room: ${msg}`
            );
            setLoading(false);
            setJoining(false);
            return;
          }
        } finally {
          setJoining(false);
        }
      }
    } catch (err) {
      console.warn('[ChatRoom] membership check failed:', err.message);
    }

    await fetchMessages();
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !walletAddress) return;
    setSending(true);
    setSendSuccess(false);
    try {
      await sendRoomMessage(roomId, newMessage.trim());
      setMessages(prev => [...prev, {
        id: prev.length, sender: walletAddress,
        content: newMessage.trim(), timestamp: Math.floor(Date.now() / 1000)
      }]);
      setNewMessage('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert(parseContractError(err).message);
    } finally {
      setSending(false);
    }
  };

  // Real-time MessageSent event listener
  const setupEventListener = async () => {
    const unsubscribe = await onMessageSent(roomId, ({ sender, content, timestamp }) => {
      if (sender?.toLowerCase() === walletAddress?.toLowerCase()) return;
      setMessages(prev => {
        const exists = prev.some(m =>
          m.sender?.toLowerCase() === sender?.toLowerCase() &&
          m.content === content &&
          Math.abs(m.timestamp - new Date(timestamp).getTime() / 1000) < 5
        );
        if (exists) return prev;
        return [...prev, { id: prev.length, sender, content, timestamp: new Date(timestamp).getTime() / 1000 }];
      });
      setTimeout(scrollToBottom, 100);
    });
    eventListenerRef.current = unsubscribe;
  };

  useEffect(() => {
    initializeRoom();
    return () => {
      if (eventListenerRef.current) {
        try { eventListenerRef.current(); } catch (_) {}
        eventListenerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, walletAddress]); // re-run if wallet connects after mount

  useEffect(() => {
    if (room && !loading) setupEventListener();
    return () => {
      if (eventListenerRef.current) {
        try { eventListenerRef.current(); } catch (_) {}
        eventListenerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, loading, roomId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">
          {joining ? 'Joining room on blockchain...' : 'Loading room from blockchain...'}
        </p>
        {joining && (
          <p className="text-xs text-gray-400 mt-2">Please confirm the transaction in MetaMask</p>
        )}
      </div>
    </div>
  );

  if (error || !room) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Room not found'}</h2>
        <Link to="/dashboard" className="btn-primary inline-flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );

  if (!walletAddress) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <Link to="/" className="btn-primary">Connect Wallet</Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900">{room.name}</h1>
              {room.isPrivate ? (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center space-x-1">
                  <Lock className="w-3 h-3" /><span>Private</span>
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center space-x-1">
                  <Globe className="w-3 h-3" /><span>Public</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>Room #{room.id} • Created: {formatDate(room.createdAt)} • {formatAddress(room.creator)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Hash className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500 text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${isOwnMessage(msg.sender) ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-lg ${
                  isOwnMessage(msg.sender) ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isOwnMessage(msg.sender) ? 'text-primary-100' : 'text-gray-600'}`}>
                      {isOwnMessage(msg.sender) ? 'You' : formatAddress(msg.sender)}
                    </span>
                    <span className={`text-xs ml-3 ${isOwnMessage(msg.sender) ? 'text-primary-200' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text" value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..." maxLength={500} disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button type="submit" disabled={!newMessage.trim() || sending}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-medium transition-colors ${
              !newMessage.trim() || sending ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}>
            {sending ? <><Loader className="w-4 h-4 animate-spin" /><span>Sending...</span></>
              : sendSuccess ? <><CheckCircle className="w-4 h-4" /><span>Sent!</span></>
              : <><Send className="w-4 h-4" /><span>Send</span></>}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">{messages.length} messages • Stored on Sepolia blockchain</p>
      </div>
    </div>
  );
};

export default ChatRoom;
