import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share, Copy, CheckCircle } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, userInfo }) => {
  const canvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && userInfo && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, userInfo]);

  const generateQRCode = async () => {
    try {
      const friendCode = {
        type: 'dechat_friend_request',
        userId: userInfo.walletAddress,
        displayName: userInfo.displayName || 'DeChat User',
        avatar: userInfo.avatar || '',
        timestamp: Date.now()
      };

      const qrData = JSON.stringify(friendCode);
      
      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      
      setQrGenerated(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCopyFriendCode = async () => {
    const friendCode = {
      type: 'dechat_friend_request',
      userId: userInfo.walletAddress,
      displayName: userInfo.displayName || 'DeChat User',
      avatar: userInfo.avatar || '',
      timestamp: Date.now()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(friendCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy friend code:', error);
    }
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `dechat-qr-${userInfo.displayName || 'user'}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'dechat-qr.png', { type: 'image/png' });
          await navigator.share({
            title: 'Add me on DeChat',
            text: `Connect with ${userInfo.displayName || 'me'} on DeChat!`,
            files: [file]
          });
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add Friend QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <canvas
                ref={canvasRef}
                className="mx-auto mb-4"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {qrGenerated && (
                <p className="text-sm text-gray-600">
                  Scan this QR code to add {userInfo.displayName || 'this user'} as a friend
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleCopyFriendCode}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Friend Code'}</span>
                </button>
                
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>

              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Share className="w-4 h-4" />
                  <span>Share QR Code</span>
                </button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>How it works:</strong> Other users can scan this QR code with their camera or upload it to their gallery to send you a friend request instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;