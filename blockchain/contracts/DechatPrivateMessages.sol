// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DechatPrivateMessages
 * @dev Smart contract for managing private wallet-to-wallet messages
 * Stores IPFS hashes of encrypted messages
 */
contract DechatPrivateMessages is ReentrancyGuard {
    
    // Events
    event MessageAdded(
        string indexed chatId,
        string ipfsHash,
        address indexed sender,
        address indexed receiver,
        uint256 timestamp
    );
    
    // Mapping: chatId => array of IPFS hashes
    mapping(string => string[]) private chatMessages;
    
    // Mapping: chatId => participants (for verification)
    mapping(string => address[2]) private chatParticipants;
    
    // Mapping: user address => array of their chat IDs
    mapping(address => string[]) private userChats;
    
    /**
     * @dev Add a message IPFS hash to a private chat
     * @param chatId Unique chat identifier (sorted addresses joined with _)
     * @param ipfsHash IPFS hash of the encrypted message
     * @param receiver Address of the message receiver
     */
    function addMessage(
        string memory chatId,
        string memory ipfsHash,
        address receiver
    ) external nonReentrant {
        require(bytes(chatId).length > 0, "Chat ID cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(ipfsHash).length <= 100, "IPFS hash too long");
        require(receiver != address(0), "Invalid receiver address");
        require(receiver != msg.sender, "Cannot send message to yourself");
        
        // Initialize chat participants if first message
        if (chatMessages[chatId].length == 0) {
            chatParticipants[chatId] = [msg.sender, receiver];
            
            // Add to user's chat list if not already there
            _addChatToUser(msg.sender, chatId);
            _addChatToUser(receiver, chatId);
        } else {
            // Verify sender is a participant
            require(
                _isParticipant(chatId, msg.sender),
                "Not a participant in this chat"
            );
        }
        
        // Add message hash
        chatMessages[chatId].push(ipfsHash);
        
        emit MessageAdded(chatId, ipfsHash, msg.sender, receiver, block.timestamp);
    }
    
    /**
     * @dev Get all message hashes for a chat
     * @param chatId Unique chat identifier
     * @return Array of IPFS hashes
     */
    function getChatMessages(string memory chatId) 
        external 
        view 
        returns (string[] memory) 
    {
        require(
            _isParticipant(chatId, msg.sender),
            "Not a participant in this chat"
        );
        
        return chatMessages[chatId];
    }
    
    /**
     * @dev Get message count for a chat
     * @param chatId Unique chat identifier
     * @return Number of messages
     */
    function getMessageCount(string memory chatId) 
        external 
        view 
        returns (uint256) 
    {
        require(
            _isParticipant(chatId, msg.sender),
            "Not a participant in this chat"
        );
        
        return chatMessages[chatId].length;
    }
    
    /**
     * @dev Get all chat IDs for a user
     * @param user Address to check
     * @return Array of chat IDs
     */
    function getUserChats(address user) 
        external 
        view 
        returns (string[] memory) 
    {
        require(
            user == msg.sender,
            "Can only view your own chats"
        );
        
        return userChats[user];
    }
    
    /**
     * @dev Check if address is a participant in a chat
     * @param chatId Unique chat identifier
     * @param user Address to check
     * @return True if participant
     */
    function isParticipant(string memory chatId, address user) 
        external 
        view 
        returns (bool) 
    {
        return _isParticipant(chatId, user);
    }
    
    /**
     * @dev Get chat participants
     * @param chatId Unique chat identifier
     * @return Array of 2 participant addresses
     */
    function getChatParticipants(string memory chatId) 
        external 
        view 
        returns (address[2] memory) 
    {
        require(
            _isParticipant(chatId, msg.sender),
            "Not a participant in this chat"
        );
        
        return chatParticipants[chatId];
    }
    
    // Internal functions
    
    /**
     * @dev Check if address is a participant (internal)
     */
    function _isParticipant(string memory chatId, address user) 
        internal 
        view 
        returns (bool) 
    {
        address[2] memory participants = chatParticipants[chatId];
        return participants[0] == user || participants[1] == user;
    }
    
    /**
     * @dev Add chat to user's chat list (internal)
     */
    function _addChatToUser(address user, string memory chatId) 
        internal 
    {
        // Check if chat already in user's list
        string[] storage chats = userChats[user];
        for (uint256 i = 0; i < chats.length; i++) {
            if (keccak256(bytes(chats[i])) == keccak256(bytes(chatId))) {
                return; // Already exists
            }
        }
        
        // Add to list
        userChats[user].push(chatId);
    }
}
