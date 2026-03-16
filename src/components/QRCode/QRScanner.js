import React, { useState, useRef } from 'react';
import { Camera, Upload, X, UserPlus, CheckCircle } from 'lucide-react';

const QRScanner = ({ isOpen, onClose, onFriendRequest }) => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const processQRData = (qrData) => {
    try {
      const friendCode = JSON.parse(qrData);
      
      if (friendCode.type === 'dechat_friend_request' && friendCode.userId) {
        setScanResult(friendCode);
        setError('');
      } else {
        setError('Invalid DeChat friend code. Please scan a valid QR code.');
      }
    } catch (err) {
      setError('Invalid QR code format. Please scan a DeChat friend QR code.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    setError('');

    // Mock QR code reading from image file
    // In a real implementation, you'd use a library like jsQR or qr-scanner
    setTimeout(() => {
      // Simulate successful scan
      const mockFriendCode = {
        type: 'dechat_friend_request',
        userId: '0x123456789abcdef123456789abcdef123456789a',
        displayName: 'Alice Cooper',
        avatar: 'https://via.placeholder.com/100/ec4899/ffffff?text=AC',
        timestamp: Date.now()
      };
      
      processQRData(JSON.stringify(mockFriendCode));
      setProcessing(false);
    }, 1500);
  };

  const handleSendFriendRequest = () => {
    if (scanResult && onFriendRequest) {
      onFriendRequest(scanResult);
      setScanResult(null);
      onClose();
    }
  };

  const handleStartCamera = () => {
    // Mock camera scanning
    setProcessing(true);
    setTimeout(() => {
      const mockFriendCode = {
        type: 'dechat_friend_request',
        userId: '0x987654321fedcba987654321fedcba987654321f',
        displayName: 'Bob Smith',
        avatar: 'https://via.placeholder.com/100/3b82f6/ffffff?text=BS',
        timestamp: Date.now()
      };
      
      processQRData(JSON.stringify(mockFriendCode));
      setProcessing(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Scan Friend QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {!scanResult ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {processing ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  ) : (
                    <Camera className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                {processing ? (
                  <p className="text-gray-600">Processing QR code...</p>
                ) : (
                  <p className="text-gray-600 mb-4">
                    Scan a DeChat friend QR code to send a friend request
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleStartCamera}
                  disabled={processing}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload from Gallery</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">QR Code Scanned Successfully!</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  {scanResult.avatar ? (
                    <img 
                      src={scanResult.avatar} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{scanResult.displayName}</h3>
                    <p className="text-sm text-gray-500">{scanResult.userId.slice(0, 10)}...</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSendFriendRequest}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Send Friend Request</span>
                </button>

                <button
                  onClick={() => setScanResult(null)}
                  className="w-full btn-secondary"
                >
                  Scan Another Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;