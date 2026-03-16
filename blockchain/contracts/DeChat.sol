// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeChat - Decentralized Chat Application with NFT Marketplace
 * @author Your Name
 * @notice This contract manages group rooms, private messaging, and NFT marketplace
 * @dev Educational smart contract for academic presentation
 * 
 * Features:
 * - Create and manage chat rooms (public/private)
 * - Group messaging within rooms
 * - Direct private messaging between users
 * - Room membership management
 * - NFT minting and marketplace
 * - Event logging for all activities
 */
contract DeChat {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Counter for generating unique room IDs
    uint256 public roomCount;
    
    /// @notice Counter for generating unique NFT token IDs
    uint256 public tokenCounter;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    /**
     * @notice Structure representing a chat room
     * @param id Unique identifier for the room
     * @param name Display name of the room
     * @param creator Address of the user who created the room
     * @param isPrivate Whether the room is private (invite-only)
     * @param createdAt Timestamp when the room was created
     * @param exists Flag to check if room exists (for validation)
     */
    struct Room {
        uint256 id;
        string name;
        address creator;
        bool isPrivate;
        uint256 createdAt;
        bool exists;
    }
    
    /**
     * @notice Structure representing a message
     * @param sender Address of the message sender
     * @param content Text content of the message
     * @param timestamp When the message was sent
     */
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }
    
    /**
     * @notice Structure representing an NFT
     * @param tokenId Unique identifier for the NFT
     * @param owner Current owner of the NFT
     * @param name Display name of the NFT
     * @param metadataURI URI pointing to NFT metadata (IPFS, etc.)
     * @param price Price in wei (if listed for sale)
     * @param isListed Whether the NFT is currently listed for sale
     */
    struct NFT {
        uint256 tokenId;
        address owner;
        string name;
        string metadataURI;
        uint256 price;
        bool isListed;
    }
    
    // ============================================
    // MAPPINGS (Storage)
    // ============================================
    
    /// @notice Mapping from room ID to Room struct
    mapping(uint256 => Room) public rooms;
    
    /// @notice Mapping to track room membership: roomId => (userAddress => isMember)
    mapping(uint256 => mapping(address => bool)) public roomMembers;
    
    /// @notice Mapping to store group messages: roomId => array of messages
    mapping(uint256 => Message[]) public roomMessages;
    
    /// @notice Mapping to store private messages: sender => (receiver => array of messages)
    mapping(address => mapping(address => Message[])) public privateMessages;
    
    /// @notice Mapping from token ID to NFT struct
    mapping(uint256 => NFT) public nfts;
    
    // ============================================
    // EVENTS
    // ============================================
    
    /**
     * @notice Emitted when a new room is created
     * @param roomId The ID of the newly created room
     * @param creator Address of the room creator
     * @param name Name of the room
     * @param isPrivate Whether the room is private
     */
    event RoomCreated(
        uint256 indexed roomId,
        address indexed creator,
        string name,
        bool isPrivate
    );
    
    /**
     * @notice Emitted when a room is deleted
     * @param roomId The ID of the deleted room
     * @param deletedBy Address of the user who deleted the room
     */
    event RoomDeleted(
        uint256 indexed roomId,
        address indexed deletedBy
    );
    
    /**
     * @notice Emitted when a user joins a room
     * @param roomId The ID of the room
     * @param user Address of the user who joined
     */
    event MemberJoined(
        uint256 indexed roomId,
        address indexed user
    );
    
    /**
     * @notice Emitted when a message is sent in a room
     * @param roomId The ID of the room
     * @param sender Address of the message sender
     * @param content Content of the message
     * @param timestamp When the message was sent
     */
    event MessageSent(
        uint256 indexed roomId,
        address indexed sender,
        string content,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a private message is sent
     * @param from Address of the sender
     * @param to Address of the receiver
     * @param content Content of the message
     * @param timestamp When the message was sent
     */
    event PrivateMessageSent(
        address indexed from,
        address indexed to,
        string content,
        uint256 timestamp
    );
    
    /**
     * @notice Emitted when a new NFT is minted
     * @param tokenId The ID of the newly minted NFT
     * @param owner Address of the NFT owner
     * @param name Name of the NFT
     */
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name
    );
    
    /**
     * @notice Emitted when an NFT is listed for sale
     * @param tokenId The ID of the listed NFT
     * @param owner Address of the NFT owner
     * @param price Price in wei
     */
    event NFTListed(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 price
    );
    
    /**
     * @notice Emitted when an NFT is purchased
     * @param tokenId The ID of the purchased NFT
     * @param buyer Address of the buyer
     * @param seller Address of the seller
     * @param price Price paid in wei
     */
    event NFTPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    /**
     * @notice Ensures the room exists
     * @param roomId The ID of the room to check
     */
    modifier roomExists(uint256 roomId) {
        require(rooms[roomId].exists, "Room does not exist");
        _;
    }
    
    /**
     * @notice Ensures only the room creator can perform the action
     * @param roomId The ID of the room
     */
    modifier onlyCreator(uint256 roomId) {
        require(
            rooms[roomId].creator == msg.sender,
            "Only room creator can perform this action"
        );
        _;
    }
    
    /**
     * @notice Ensures the user is a member of the room
     * @param roomId The ID of the room
     */
    modifier onlyMember(uint256 roomId) {
        require(
            roomMembers[roomId][msg.sender],
            "You are not a member of this room"
        );
        _;
    }
    
    // ============================================
    // ROOM MANAGEMENT FUNCTIONS
    // ============================================
    
    /**
     * @notice Creates a new chat room
     * @param name The name of the room
     * @param isPrivate Whether the room should be private (invite-only)
     * @return roomId The ID of the newly created room
     * 
     * Requirements:
     * - Room name cannot be empty
     * - Room name must be 100 characters or less
     * 
     * Effects:
     * - Increments roomCount
     * - Creates new room with unique ID
     * - Automatically adds creator as first member
     * - Emits RoomCreated event
     */
    function createRoom(string memory name, bool isPrivate) 
        external 
        returns (uint256) 
    {
        // Validate input
        require(bytes(name).length > 0, "Room name cannot be empty");
        require(bytes(name).length <= 100, "Room name too long");
        
        // Generate new room ID
        uint256 roomId = roomCount;
        
        // Create room
        rooms[roomId] = Room({
            id: roomId,
            name: name,
            creator: msg.sender,
            isPrivate: isPrivate,
            createdAt: block.timestamp,
            exists: true
        });
        
        // Automatically add creator as member
        roomMembers[roomId][msg.sender] = true;
        
        // Increment counter for next room
        roomCount++;
        
        // Emit event
        emit RoomCreated(roomId, msg.sender, name, isPrivate);
        emit MemberJoined(roomId, msg.sender);
        
        return roomId;
    }
    
    /**
     * @notice Retrieves information about a specific room
     * @param roomId The ID of the room to retrieve
     * @return Room struct containing room information
     */
    function getRoom(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        returns (Room memory) 
    {
        return rooms[roomId];
    }
    
    /**
     * @notice Retrieves all existing rooms
     * @return Array of all Room structs
     * 
     * Note: This function can be gas-intensive for many rooms.
     * Consider pagination for production use.
     */
    function getAllRooms() 
        external 
        view 
        returns (Room[] memory) 
    {
        // Count existing rooms
        uint256 existingCount = 0;
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].exists) {
                existingCount++;
            }
        }
        
        // Create array of existing rooms
        Room[] memory allRooms = new Room[](existingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].exists) {
                allRooms[index] = rooms[i];
                index++;
            }
        }
        
        return allRooms;
    }
    
    /**
     * @notice Deletes a room (only creator can delete)
     * @param roomId The ID of the room to delete
     * 
     * Requirements:
     * - Room must exist
     * - Only creator can delete the room
     * 
     * Effects:
     * - Marks room as non-existent
     * - Emits RoomDeleted event
     * 
     * Note: Messages are not deleted to preserve history
     */
    function deleteRoom(uint256 roomId) 
        external 
        roomExists(roomId) 
        onlyCreator(roomId) 
    {
        // Mark room as deleted
        rooms[roomId].exists = false;
        
        // Emit event
        emit RoomDeleted(roomId, msg.sender);
    }
    
    // ============================================
    // ROOM MEMBERSHIP FUNCTIONS
    // ============================================
    
    /**
     * @notice Allows a user to join a public room
     * @param roomId The ID of the room to join
     * 
     * Requirements:
     * - Room must exist
     * - Room must be public (not private)
     * - User must not already be a member
     * 
     * Effects:
     * - Adds user to room members
     * - Emits MemberJoined event
     */
    function joinRoom(uint256 roomId) 
        external 
        roomExists(roomId) 
    {
        // Check if room is private
        require(
            !rooms[roomId].isPrivate,
            "Cannot join private room without invitation"
        );
        
        // Check if already a member
        require(
            !roomMembers[roomId][msg.sender],
            "Already a member of this room"
        );
        
        // Add user as member
        roomMembers[roomId][msg.sender] = true;
        
        // Emit event
        emit MemberJoined(roomId, msg.sender);
    }
    
    /**
     * @notice Adds a member to a private room (only creator can add)
     * @param roomId The ID of the room
     * @param user The address of the user to add
     * 
     * Requirements:
     * - Room must exist
     * - Only creator can add members
     * - User must not already be a member
     * 
     * Effects:
     * - Adds user to room members
     * - Emits MemberJoined event
     */
    function addMember(uint256 roomId, address user) 
        external 
        roomExists(roomId) 
        onlyCreator(roomId) 
    {
        // Check if already a member
        require(
            !roomMembers[roomId][user],
            "User is already a member"
        );
        
        // Add user as member
        roomMembers[roomId][user] = true;
        
        // Emit event
        emit MemberJoined(roomId, user);
    }
    
    /**
     * @notice Checks if a user is a member of a room
     * @param roomId The ID of the room
     * @param user The address of the user to check
     * @return bool True if user is a member, false otherwise
     */
    function isMember(uint256 roomId, address user) 
        external 
        view 
        returns (bool) 
    {
        return roomMembers[roomId][user];
    }
    
    // ============================================
    // GROUP MESSAGING FUNCTIONS
    // ============================================
    
    /**
     * @notice Sends a message to a room
     * @param roomId The ID of the room
     * @param content The message content
     * 
     * Requirements:
     * - Room must exist
     * - User must be a member of the room
     * - Message content cannot be empty
     * 
     * Effects:
     * - Adds message to room's message array
     * - Emits MessageSent event
     */
    function sendMessage(uint256 roomId, string memory content) 
        external 
        roomExists(roomId) 
        onlyMember(roomId) 
    {
        // Validate message content
        require(bytes(content).length > 0, "Message cannot be empty");
        require(bytes(content).length <= 1000, "Message too long");
        
        // Create message
        Message memory newMessage = Message({
            sender: msg.sender,
            content: content,
            timestamp: block.timestamp
        });
        
        // Add message to room
        roomMessages[roomId].push(newMessage);
        
        // Emit event
        emit MessageSent(roomId, msg.sender, content, block.timestamp);
    }
    
    /**
     * @notice Retrieves all messages from a room
     * @param roomId The ID of the room
     * @return Array of Message structs
     * 
     * Requirements:
     * - Room must exist
     * - User must be a member of the room
     */
    function getMessages(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        onlyMember(roomId) 
        returns (Message[] memory) 
    {
        return roomMessages[roomId];
    }
    
    /**
     * @notice Gets the number of messages in a room
     * @param roomId The ID of the room
     * @return uint256 Number of messages
     */
    function getMessageCount(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        returns (uint256) 
    {
        return roomMessages[roomId].length;
    }
    
    // ============================================
    // PRIVATE MESSAGING FUNCTIONS
    // ============================================
    
    /**
     * @notice Sends a private message to another user
     * @param to The address of the recipient
     * @param content The message content
     * 
     * Requirements:
     * - Recipient cannot be sender (no self-messaging)
     * - Message content cannot be empty
     * 
     * Effects:
     * - Stores message in both sender's and receiver's message history
     * - Emits PrivateMessageSent event
     */
    function sendPrivateMessage(address to, string memory content) 
        external 
    {
        // Validate recipient
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot send message to yourself");
        
        // Validate message content
        require(bytes(content).length > 0, "Message cannot be empty");
        require(bytes(content).length <= 1000, "Message too long");
        
        // Create message
        Message memory newMessage = Message({
            sender: msg.sender,
            content: content,
            timestamp: block.timestamp
        });
        
        // Store message in sender's outbox
        privateMessages[msg.sender][to].push(newMessage);
        
        // Store message in receiver's inbox
        privateMessages[to][msg.sender].push(newMessage);
        
        // Emit event
        emit PrivateMessageSent(msg.sender, to, content, block.timestamp);
    }
    
    /**
     * @notice Retrieves private messages between two users
     * @param user1 Address of first user
     * @param user2 Address of second user
     * @return Array of Message structs
     * 
     * Requirements:
     * - Caller must be one of the two users
     * 
     * Note: Returns messages from user1's perspective
     */
    function getPrivateMessages(address user1, address user2) 
        external 
        view 
        returns (Message[] memory) 
    {
        // Ensure caller is one of the participants
        require(
            msg.sender == user1 || msg.sender == user2,
            "You can only view your own messages"
        );
        
        return privateMessages[user1][user2];
    }
    
    /**
     * @notice Gets the number of private messages between two users
     * @param user1 Address of first user
     * @param user2 Address of second user
     * @return uint256 Number of messages
     */
    function getPrivateMessageCount(address user1, address user2) 
        external 
        view 
        returns (uint256) 
    {
        require(
            msg.sender == user1 || msg.sender == user2,
            "You can only view your own message count"
        );
        
        return privateMessages[user1][user2].length;
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * @notice Gets the total number of rooms created (including deleted)
     * @return uint256 Total room count
     */
    function getTotalRoomCount() external view returns (uint256) {
        return roomCount;
    }
    
    /**
     * @notice Checks if a room exists
     * @param roomId The ID of the room to check
     * @return bool True if room exists, false otherwise
     */
    function doesRoomExist(uint256 roomId) external view returns (bool) {
        return rooms[roomId].exists;
    }
    
    // ============================================
    // NFT MARKETPLACE FUNCTIONS
    // ============================================
    
    /**
     * @notice Mints a new NFT
     * @param name The name of the NFT
     * @param metadataURI URI pointing to NFT metadata (e.g., IPFS link)
     * @return tokenId The ID of the newly minted NFT
     * 
     * Requirements:
     * - Name cannot be empty
     * - Metadata URI cannot be empty
     * 
     * Effects:
     * - Increments tokenCounter
     * - Creates new NFT with unique ID
     * - Sets caller as owner
     * - NFT is not listed by default
     * - Emits NFTMinted event
     */
    function mintNFT(string memory name, string memory metadataURI) 
        external 
        returns (uint256) 
    {
        // Validate input
        require(bytes(name).length > 0, "NFT name cannot be empty");
        require(bytes(name).length <= 100, "NFT name too long");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(bytes(metadataURI).length <= 200, "Metadata URI too long");
        
        // Generate new token ID
        uint256 tokenId = tokenCounter;
        
        // Create NFT
        nfts[tokenId] = NFT({
            tokenId: tokenId,
            owner: msg.sender,
            name: name,
            metadataURI: metadataURI,
            price: 0,
            isListed: false
        });
        
        // Increment counter for next NFT
        tokenCounter++;
        
        // Emit event
        emit NFTMinted(tokenId, msg.sender, name);
        
        return tokenId;
    }
    
    /**
     * @notice Lists an NFT for sale in the marketplace
     * @param tokenId The ID of the NFT to list
     * @param price The price in wei
     * 
     * Requirements:
     * - NFT must exist
     * - Caller must be the NFT owner
     * - Price must be greater than 0
     * 
     * Effects:
     * - Sets NFT price
     * - Marks NFT as listed
     * - Emits NFTListed event
     */
    function listNFT(uint256 tokenId, uint256 price) 
        external 
    {
        // Validate token exists
        require(tokenId < tokenCounter, "NFT does not exist");
        
        // Validate ownership
        require(
            nfts[tokenId].owner == msg.sender,
            "Only NFT owner can list for sale"
        );
        
        // Validate price
        require(price > 0, "Price must be greater than 0");
        
        // Update NFT
        nfts[tokenId].price = price;
        nfts[tokenId].isListed = true;
        
        // Emit event
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    /**
     * @notice Purchases a listed NFT
     * @param tokenId The ID of the NFT to purchase
     * 
     * Requirements:
     * - NFT must exist
     * - NFT must be listed for sale
     * - Sent value must equal the price
     * - Buyer cannot be the current owner
     * 
     * Effects:
     * - Transfers ETH to seller
     * - Transfers NFT ownership to buyer
     * - Unlists the NFT
     * - Emits NFTPurchased event
     */
    function buyNFT(uint256 tokenId) 
        external 
        payable 
    {
        // Validate token exists
        require(tokenId < tokenCounter, "NFT does not exist");
        
        NFT storage nft = nfts[tokenId];
        
        // Validate NFT is listed
        require(nft.isListed, "NFT is not listed for sale");
        
        // Validate price
        require(
            msg.value == nft.price,
            "Incorrect payment amount"
        );
        
        // Prevent buying own NFT
        require(
            msg.sender != nft.owner,
            "Cannot buy your own NFT"
        );
        
        // Store seller address before transfer
        address seller = nft.owner;
        uint256 price = nft.price;
        
        // Transfer ownership
        nft.owner = msg.sender;
        nft.isListed = false;
        nft.price = 0;
        
        // Transfer ETH to seller
        (bool success, ) = payable(seller).call{value: price}("");
        require(success, "ETH transfer failed");
        
        // Emit event
        emit NFTPurchased(tokenId, msg.sender, seller, price);
    }
    
    /**
     * @notice Retrieves all NFTs currently listed for sale
     * @return Array of NFT structs that are listed
     * 
     * Note: This function can be gas-intensive for many NFTs.
     * Consider pagination for production use.
     */
    function getAllListedNFTs() 
        external 
        view 
        returns (NFT[] memory) 
    {
        // Count listed NFTs
        uint256 listedCount = 0;
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (nfts[i].isListed) {
                listedCount++;
            }
        }
        
        // Create array of listed NFTs
        NFT[] memory listedNFTs = new NFT[](listedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (nfts[i].isListed) {
                listedNFTs[index] = nfts[i];
                index++;
            }
        }
        
        return listedNFTs;
    }
    
    /**
     * @notice Gets all NFTs owned by a specific address
     * @param owner The address to check
     * @return Array of NFT structs owned by the address
     */
    function getNFTsByOwner(address owner) 
        external 
        view 
        returns (NFT[] memory) 
    {
        // Count NFTs owned by address
        uint256 ownedCount = 0;
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (nfts[i].owner == owner) {
                ownedCount++;
            }
        }
        
        // Create array of owned NFTs
        NFT[] memory ownedNFTs = new NFT[](ownedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (nfts[i].owner == owner) {
                ownedNFTs[index] = nfts[i];
                index++;
            }
        }
        
        return ownedNFTs;
    }
    
    /**
     * @notice Gets a specific NFT by token ID
     * @param tokenId The ID of the NFT
     * @return NFT struct
     */
    function getNFT(uint256 tokenId) 
        external 
        view 
        returns (NFT memory) 
    {
        require(tokenId < tokenCounter, "NFT does not exist");
        return nfts[tokenId];
    }
    
    /**
     * @notice Gets the total number of NFTs minted
     * @return uint256 Total NFT count
     */
    function getTotalNFTCount() external view returns (uint256) {
        return tokenCounter;
    }
}
