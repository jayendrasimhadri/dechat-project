/**
 * IPFS Integration Utility
 * 
 * This file provides functions to interact with IPFS for storing chat messages.
 * You need to configure your IPFS provider before using these functions.
 * 
 * SETUP OPTIONS:
 * 
 * Option 1: Use Pinata (Recommended for beginners)
 * - Sign up at https://pinata.cloud
 * - Get your API Key and Secret
 * - Set them in the config below
 * 
 * Option 2: Use Web3.Storage
 * - Sign up at https://web3.storage
 * - Get your API token
 * - Set it in the config below
 * 
 * Option 3: Use local IPFS node
 * - Install IPFS Desktop or IPFS CLI
 * - Run: ipfs daemon
 * - Use http://localhost:5001 as the endpoint
 * 
 * Option 4: Use Infura IPFS
 * - Sign up at https://infura.io
 * - Create an IPFS project
 * - Get your Project ID and Secret
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const IPFS_CONFIG = {
  provider: process.env.REACT_APP_IPFS_PROVIDER || 'pinata', // Options: 'pinata', 'web3storage', 'infura', 'local'

  // Pinata Configuration
  pinata: {
    apiKey: process.env.REACT_APP_PINATA_API_KEY || '',
    apiSecret: process.env.REACT_APP_PINATA_API_SECRET || '',
    endpoint: 'https://api.pinata.cloud'
  },

  // Web3.Storage Configuration
  web3storage: {
    token: process.env.REACT_APP_WEB3_STORAGE_TOKEN || ''
  },

  // Infura Configuration
  infura: {
    projectId: process.env.REACT_APP_INFURA_PROJECT_ID || '',
    projectSecret: process.env.REACT_APP_INFURA_PROJECT_SECRET || '',
    endpoint: 'https://ipfs.infura.io:5001'
  },

  // Local IPFS Node Configuration
  local: {
    endpoint: process.env.REACT_APP_IPFS_LOCAL_ENDPOINT || 'http://localhost:5001'
  }
};

// ============================================
// IPFS FUNCTIONS
// ============================================

/**
 * Upload a message to IPFS
 * @param {Object} messageData - The message data to upload
 * @returns {Promise<string>} - The IPFS hash (CID)
 */
export const uploadMessageToIPFS = async (messageData) => {
  const provider = IPFS_CONFIG.provider;
  
  try {
    switch (provider) {
      case 'pinata':
        return await uploadToPinata(messageData);
      case 'web3storage':
        return await uploadToWeb3Storage(messageData);
      case 'infura':
        return await uploadToInfura(messageData);
      case 'local':
        return await uploadToLocalIPFS(messageData);
      default:
        throw new Error(`Unknown IPFS provider: ${provider}`);
    }
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw error;
  }
};

/**
 * Retrieve a message from IPFS
 * @param {string} ipfsHash - The IPFS hash (CID)
 * @returns {Promise<Object>} - The message data
 */
export const getMessageFromIPFS = async (ipfsHash) => {
  try {
    // Try Pinata gateway first (faster and more reliable)
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
    ];
    
    for (const gateway of gateways) {
      try {
        console.log(`🔍 Trying gateway: ${gateway}`);
        const response = await fetch(gateway, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Successfully retrieved from: ${gateway}`);
          return data;
        }
      } catch (err) {
        console.log(`⚠️ Gateway failed: ${gateway}`, err.message);
        continue;
      }
    }
    
    throw new Error('All IPFS gateways failed');
  } catch (error) {
    console.error('IPFS retrieval failed:', error);
    throw error;
  }
};

// ============================================
// PROVIDER-SPECIFIC IMPLEMENTATIONS
// ============================================

/**
 * Upload to Pinata
 */
async function uploadToPinata(messageData) {
  const { apiKey, apiSecret, endpoint } = IPFS_CONFIG.pinata;
  
  if (!apiKey) {
    throw new Error('Pinata API credentials are not configured. Set REACT_APP_PINATA_API_KEY and REACT_APP_PINATA_API_SECRET in your .env file.');
  }
  
  const response = await fetch(`${endpoint}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': apiSecret
    },
    body: JSON.stringify({
      pinataContent: messageData,
      pinataMetadata: {
        name: `message-${messageData.id}`,
        keyvalues: {
          sender: messageData.sender,
          timestamp: messageData.timestamp
        }
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
  
  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Upload to Web3.Storage
 */
async function uploadToWeb3Storage(messageData) {
  const { token } = IPFS_CONFIG.web3storage;
  
  if (!token) {
    throw new Error('Web3.Storage token is not configured. Set REACT_APP_WEB3_STORAGE_TOKEN in your .env file.');
  }
  
  // Note: You'll need to install @web3-storage/w3up-client
  // Run: npm install @web3-storage/w3up-client
  throw new Error('Web3.Storage implementation requires @web3-storage/w3up-client package. Please install it first.');
}

/**
 * Upload to Infura IPFS
 */
async function uploadToInfura(messageData) {
  const { projectId, projectSecret, endpoint } = IPFS_CONFIG.infura;
  
  if (!projectId) {
    throw new Error('Infura credentials are not configured. Set REACT_APP_INFURA_PROJECT_ID and REACT_APP_INFURA_PROJECT_SECRET in your .env file.');
  }

  const auth = 'Basic ' + btoa(projectId + ':' + projectSecret);
  
  const response = await fetch(`${endpoint}/api/v0/add`, {
    method: 'POST',
    headers: {
      'Authorization': auth
    },
    body: JSON.stringify(messageData)
  });
  
  if (!response.ok) {
    throw new Error('Infura IPFS upload failed');
  }
  
  const result = await response.json();
  return result.Hash;
}

/**
 * Upload to Local IPFS Node
 */
async function uploadToLocalIPFS(messageData) {
  const { endpoint } = IPFS_CONFIG.local;
  
  const formData = new FormData();
  const blob = new Blob([JSON.stringify(messageData)], { type: 'application/json' });
  formData.append('file', blob);
  
  const response = await fetch(`${endpoint}/api/v0/add`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Local IPFS upload failed. Make sure IPFS daemon is running.');
  }
  
  const result = await response.json();
  return result.Hash;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if IPFS is configured
 */
export const isIPFSConfigured = () => {
  const provider = IPFS_CONFIG.provider;
  
  switch (provider) {
    case 'pinata':
      return !!IPFS_CONFIG.pinata.apiKey && !!IPFS_CONFIG.pinata.apiSecret;
    case 'web3storage':
      return !!IPFS_CONFIG.web3storage.token;
    case 'infura':
      return !!IPFS_CONFIG.infura.projectId && !!IPFS_CONFIG.infura.projectSecret;
    case 'local':
      return true; // Assume local is always available if selected
    default:
      return false;
  }
};

/**
 * Get IPFS gateway URL for a hash
 */
export const getIPFSGatewayUrl = (ipfsHash) => {
  return `https://ipfs.io/ipfs/${ipfsHash}`;
};

/**
 * Validate IPFS hash format
 */
export const isValidIPFSHash = (hash) => {
  // Basic validation for CIDv0 and CIDv1
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || /^b[A-Za-z2-7]{58}$/.test(hash);
};

/**
 * Upload chat manifest (list of message hashes) to IPFS
 * @param {Object} manifestData - The manifest data containing message hashes
 * @returns {Promise<string>} - The IPFS hash (CID) of the manifest
 */
export const uploadChatManifest = async (manifestData) => {
  return await uploadMessageToIPFS(manifestData);
};

/**
 * Get chat manifest from IPFS
 * @param {string} ipfsHash - The IPFS hash of the manifest
 * @returns {Promise<Object>} - The manifest data
 */
export const getChatManifest = async (ipfsHash) => {
  return await getMessageFromIPFS(ipfsHash);
};
