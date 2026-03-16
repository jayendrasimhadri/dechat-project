// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeChat - Decentralized Chat App with NFT-based Private Rooms and Marketplace
 * @notice Full-featured chat + NFT system
 */
contract DeChat {

    // ============================================
    // STATE VARIABLES
    // ============================================

    uint256 public roomCount;
    uint256 public tokenCounter;

    // ============================================
    // STRUCTS
    // ============================================

    struct Room {
        uint256 id;
        string name;
        address creator;
        bool isPrivate;
        uint256 createdAt;
        bool exists;
    }

    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }

    struct NFT {
        uint256 tokenId;
        address owner;
        string name;
        string metadataURI;
        uint256 price;
        bool isListed;
    }

    // ============================================
    // MAPPINGS
    // ============================================

    mapping(uint256 => Room) public rooms;
    mapping(uint256 => mapping(address => bool)) public roomMembers;
    mapping(uint256 => Message[]) public roomMessages;
    mapping(address => address[]) public privateContacts;
    mapping(address => mapping(address => Message[])) public privateMessages;
    mapping(uint256 => NFT) public nfts;
    mapping(uint256 => uint256) public roomRequiredNFT;

    // ============================================
    // EVENTS
    // ============================================

    event RoomCreated(uint256 indexed roomId, address indexed creator, string name, bool isPrivate);
    event MemberJoined(uint256 indexed roomId, address indexed user);
    event MessageSent(uint256 indexed roomId, address indexed sender, string content, uint256 timestamp);
    event PrivateMessageSent(address indexed from, address indexed to, string content, uint256 timestamp);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string name);
    event NFTListed(uint256 indexed tokenId, address indexed owner, uint256 price);
    event NFTPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);

    // ============================================
    // MODIFIERS
    // ============================================

    modifier roomExists(uint256 roomId) {
        require(rooms[roomId].exists, "Room does not exist");
        _;
    }

    modifier onlyMember(uint256 roomId) {
        require(roomMembers[roomId][msg.sender], "Not a member of this room");
        _;
    }

    modifier onlyCreator(uint256 roomId) {
        require(rooms[roomId].creator == msg.sender, "Only creator can perform this action");
        _;
    }

    // ============================================
    // ROOM FUNCTIONS
    // ============================================

    function createPublicRoom(string memory name) external returns (uint256) {
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid room name");
        uint256 roomId = roomCount;
        rooms[roomId] = Room({
            id: roomId,
            name: name,
            creator: msg.sender,
            isPrivate: false,
            createdAt: block.timestamp,
            exists: true
        });
        roomMembers[roomId][msg.sender] = true;
        roomCount++;
        emit RoomCreated(roomId, msg.sender, name, false);
        emit MemberJoined(roomId, msg.sender);
        return roomId;
    }

    function createPrivateRoomWithNFT(string memory roomName, uint256 existingNFTId) external returns (uint256) {
        require(bytes(roomName).length > 0 && bytes(roomName).length <= 100, "Invalid room name");
        uint256 nftId;
        if (existingNFTId == 0) {
            nftId = tokenCounter;
            nfts[nftId] = NFT({
                tokenId: nftId,
                owner: msg.sender,
                name: string(abi.encodePacked("PrivateRoomNFT-", roomName)),
                metadataURI: "",
                price: 0,
                isListed: false
            });
            tokenCounter++;
            emit NFTMinted(nftId, msg.sender, string(abi.encodePacked("PrivateRoomNFT-", roomName)));
        } else {
            require(nfts[existingNFTId].owner == msg.sender, "Must own NFT");
            nftId = existingNFTId;
        }
        uint256 roomId = roomCount;
        rooms[roomId] = Room({
            id: roomId,
            name: roomName,
            creator: msg.sender,
            isPrivate: true,
            createdAt: block.timestamp,
            exists: true
        });
        roomRequiredNFT[roomId] = nftId;
        roomMembers[roomId][msg.sender] = true;
        roomCount++;
        emit RoomCreated(roomId, msg.sender, roomName, true);
        emit MemberJoined(roomId, msg.sender);
        return roomId;
    }

    function joinPublicRoom(uint256 roomId) external roomExists(roomId) {
        require(!rooms[roomId].isPrivate, "Cannot join private room here");
        require(!roomMembers[roomId][msg.sender], "Already a member");
        roomMembers[roomId][msg.sender] = true;
        emit MemberJoined(roomId, msg.sender);
    }

    function joinPrivateRoom(uint256 roomId) external roomExists(roomId) {
        Room storage r = rooms[roomId];
        require(r.isPrivate, "Not a private room");
        require(!roomMembers[roomId][msg.sender], "Already a member");
        uint256 requiredNFT = roomRequiredNFT[roomId];
        require(nfts[requiredNFT].owner == msg.sender, "Must own NFT to join");
        roomMembers[roomId][msg.sender] = true;
        emit MemberJoined(roomId, msg.sender);
    }

    function sendRoomMessage(uint256 roomId, string memory content)
        external roomExists(roomId) onlyMember(roomId)
    {
        require(bytes(content).length > 0 && bytes(content).length <= 1000, "Invalid message length");
        roomMessages[roomId].push(Message({sender: msg.sender, content: content, timestamp: block.timestamp}));
        emit MessageSent(roomId, msg.sender, content, block.timestamp);
    }

    function getRoomMessages(uint256 roomId)
        external view roomExists(roomId) onlyMember(roomId)
        returns (Message[] memory)
    {
        return roomMessages[roomId];
    }

    /// @notice Get a single room by ID (added to match frontend ABI)
    function getRoom(uint256 roomId) external view roomExists(roomId) returns (Room memory) {
        return rooms[roomId];
    }

    // ============================================
    // PRIVATE CHAT FUNCTIONS
    // ============================================

    function sendPrivateMessage(address to, string memory content) external {
        require(to != address(0) && to != msg.sender, "Invalid recipient");
        require(bytes(content).length > 0 && bytes(content).length <= 1000, "Invalid message");
        Message memory msgObj = Message({sender: msg.sender, content: content, timestamp: block.timestamp});
        privateMessages[msg.sender][to].push(msgObj);
        privateMessages[to][msg.sender].push(msgObj);

        bool found = false;
        for (uint i = 0; i < privateContacts[msg.sender].length; i++) {
            if (privateContacts[msg.sender][i] == to) { found = true; break; }
        }
        if (!found) privateContacts[msg.sender].push(to);

        found = false;
        for (uint i = 0; i < privateContacts[to].length; i++) {
            if (privateContacts[to][i] == msg.sender) { found = true; break; }
        }
        if (!found) privateContacts[to].push(msg.sender);

        emit PrivateMessageSent(msg.sender, to, content, block.timestamp);
    }

    function getPrivateContacts(address user) external view returns (address[] memory) {
        return privateContacts[user];
    }

    function getPrivateMessages(address user1, address user2) external view returns (Message[] memory) {
        return privateMessages[user1][user2];
    }

    // ============================================
    // NFT MARKETPLACE FUNCTIONS
    // ============================================

    function mintNFT(string memory name, string memory metadataURI) external returns (uint256) {
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid NFT name");
        require(bytes(metadataURI).length > 0 && bytes(metadataURI).length <= 200, "Invalid URI");
        uint256 tokenId = tokenCounter;
        nfts[tokenId] = NFT({tokenId: tokenId, owner: msg.sender, name: name, metadataURI: metadataURI, price: 0, isListed: false});
        tokenCounter++;
        emit NFTMinted(tokenId, msg.sender, name);
        return tokenId;
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(tokenId < tokenCounter, "NFT does not exist");
        NFT storage nft = nfts[tokenId];
        require(nft.owner == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");
        nft.isListed = true;
        nft.price = price;
        emit NFTListed(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external payable {
        require(tokenId < tokenCounter, "NFT does not exist");
        NFT storage nft = nfts[tokenId];
        require(nft.isListed, "NFT not listed");
        require(msg.value == nft.price, "Incorrect ETH sent");
        require(msg.sender != nft.owner, "Cannot buy your own NFT");
        address seller = nft.owner;
        nft.owner = msg.sender;
        nft.isListed = false;
        nft.price = 0;
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "ETH transfer failed");
        emit NFTPurchased(tokenId, msg.sender, seller, msg.value);
    }

    // ============================================
    // UTILITY
    // ============================================

    function isMember(uint256 roomId, address user) external view returns (bool) {
        return roomMembers[roomId][user];
    }

    function getAllRooms() external view returns (Room[] memory) {
        Room[] memory result = new Room[](roomCount);
        uint256 index = 0;
        for (uint i = 0; i < roomCount; i++) {
            if (rooms[i].exists) {
                result[index] = rooms[i];
                index++;
            }
        }
        return result;
    }

    function getNFT(uint256 tokenId) external view returns (NFT memory) {
        require(tokenId < tokenCounter, "NFT does not exist");
        return nfts[tokenId];
    }

    function getAllNFTs() external view returns (NFT[] memory) {
        NFT[] memory result = new NFT[](tokenCounter);
        for (uint i = 0; i < tokenCounter; i++) {
            result[i] = nfts[i];
        }
        return result;
    }
}
