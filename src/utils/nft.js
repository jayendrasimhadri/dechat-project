import { ethers } from 'ethers';

const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || '';
const ALCHEMY_BASE_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

/**
 * Fetch NFTs owned by an address using Alchemy NFT API
 */
export const fetchUserNFTs = async (walletAddress) => {
  if (!ALCHEMY_API_KEY) {
    console.warn('Alchemy API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${ALCHEMY_BASE_URL}/getNFTs?owner=${walletAddress}&withMetadata=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFTs');
    }
    
    const data = await response.json();
    
    return data.ownedNfts.map(nft => ({
      contractAddress: nft.contract.address,
      tokenId: nft.id.tokenId,
      name: nft.title || nft.contract.name || 'Unknown NFT',
      collection: nft.contract.name,
      image: nft.media[0]?.gateway || nft.metadata?.image || '',
      description: nft.description || '',
    }));
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return [];
  }
};

/**
 * Check if user owns specific NFT using ethers.js
 */
export const checkNFTOwnership = async (walletAddress, nftContract) => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // ERC721 balanceOf interface
    const contract = new ethers.Contract(
      nftContract,
      ['function balanceOf(address owner) view returns (uint256)'],
      provider
    );
    
    const balance = await contract.balanceOf(walletAddress);
    return balance > 0n;
  } catch (error) {
    console.error('Failed to check NFT ownership:', error);
    return false;
  }
};

/**
 * Get NFT metadata
 */
export const getNFTMetadata = async (nftContract, tokenId) => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    const contract = new ethers.Contract(
      nftContract,
      [
        'function tokenURI(uint256 tokenId) view returns (string)',
        'function name() view returns (string)',
        'function symbol() view returns (string)'
      ],
      provider
    );
    
    const [tokenURI, name, symbol] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.name(),
      contract.symbol()
    ]);
    
    // Fetch metadata from tokenURI
    let metadata = {};
    if (tokenURI) {
      const response = await fetch(tokenURI);
      metadata = await response.json();
    }
    
    return {
      name: metadata.name || name,
      symbol,
      image: metadata.image || '',
      description: metadata.description || '',
      attributes: metadata.attributes || []
    };
  } catch (error) {
    console.error('Failed to get NFT metadata:', error);
    return null;
  }
};
