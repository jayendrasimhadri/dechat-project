// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DechatRooms
 * @dev Smart contract for managing decentralized chat rooms with NFT gating
 */
contract DechatRooms is Ownable, ReentrancyGuard {
    
    struct Room {
        uint256 id;
        string name;
        address creator;
        bool isNFTGated;
        address nftContract;
        uint256 createdAt;
        bool isActive;
    }
    
    // State variables
    Room[] public rooms;
    uint256 public roomCount;
    
    // Mappings
    mapping(uint256 => string[]) public roomMessageHashes;
    mapping(uint256 => address[]) public roomMembers;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => uint256)) public memberJoinedAt;
    
    // Events
    event RoomCreated(
        uint256 indexed roomId,
        string name,
        address indexed creator,
        bool isNFTGated,
        address nftContract
    );
    
    event MessageAdded(
        uint256 indexed roomId,
        string ipfsHash,
        address indexed sender,
        uint256 timestamp
    );
    
    event MemberJoined(
        uint256 indexed roomId,
        address indexed member,
        uint256 timestamp
    );
    
    event MemberLeft(
        uint256 indexed roomId,
        address indexed member,
        uint256 timestamp
    );
    
    event RoomDeactivated(
        uint256 indexed roomId,
        address indexed deactivatedBy
    );
    
    // Modifiers
    modifier roomExists(uint256 roomId) {
        require(roomId < roomCount, "Room does not exist");
        require(rooms[roomId].isActive, "Room is not active");
        _;
    }
    
    modifier onlyRoomMember(uint256 roomId) {
        require(isMember[roomId][msg.sender], "Not a room member");
        _;
    }
    
    modifier onlyRoomCreator(uint256 roomId) {
        require(rooms[roomId].creator == msg.sender, "Not room creator");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new chat room
     * @param _name Name of the room
     * @param _isNFTGated Whether the room requires NFT ownership
     * @param _nftContract Address of the NFT contract (if gated)
     */
    function createRoom(
        string memory _name,
        bool _isNFTGated,
        address _nftContract
    ) external nonReentrant returns (uint256) {
        require(bytes(_name).length > 0, "Room name cannot be empty");
        require(bytes(_name).length <= 100, "Room name too long");
        
        if (_isNFTGated) {
            require(_nftContract != address(0), "Invalid NFT contract address");
            // Verify creator owns the NFT
            require(
                IERC721(_nftContract).balanceOf(msg.sender) > 0,
                "Creator must own the required NFT"
            );
        }
        
        uint256 roomId = roomCount;
        
        Room memory newRoom = Room({
            id: roomId,
            name: _name,
            creator: msg.sender,
            isNFTGated: _isNFTGated,
            nftContract: _nftContract,
            createdAt: block.timestamp,
            isActive: true
        });
        
        rooms.push(newRoom);
        
        // Auto-join creator
        roomMembers[roomId].push(msg.sender);
        isMember[roomId][msg.sender] = true;
        memberJoinedAt[roomId][msg.sender] = block.timestamp;
        
        roomCount++;
        
        emit RoomCreated(roomId, _name, msg.sender, _isNFTGated, _nftContract);
        emit MemberJoined(roomId, msg.sender, block.timestamp);
        
        return roomId;
    }
    
    /**
     * @dev Join an existing room
     * @param roomId ID of the room to join
     */
    function joinRoom(uint256 roomId) 
        external 
        nonReentrant 
        roomExists(roomId) 
    {
        require(!isMember[roomId][msg.sender], "Already a member");
        
        Room memory room = rooms[roomId];
        
        // Check NFT gating
        if (room.isNFTGated) {
            require(
                IERC721(room.nftContract).balanceOf(msg.sender) > 0,
                "Must own required NFT to join"
            );
        }
        
        roomMembers[roomId].push(msg.sender);
        isMember[roomId][msg.sender] = true;
        memberJoinedAt[roomId][msg.sender] = block.timestamp;
        
        emit MemberJoined(roomId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Leave a room
     * @param roomId ID of the room to leave
     */
    function leaveRoom(uint256 roomId) 
        external 
        roomExists(roomId) 
        onlyRoomMember(roomId) 
    {
        require(rooms[roomId].creator != msg.sender, "Creator cannot leave");
        
        isMember[roomId][msg.sender] = false;
        
        emit MemberLeft(roomId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add a message IPFS hash to a room
     * @param roomId ID of the room
     * @param ipfsHash IPFS hash of the message
     */
    function addMessage(uint256 roomId, string memory ipfsHash) 
        external 
        roomExists(roomId) 
        onlyRoomMember(roomId) 
    {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(ipfsHash).length <= 100, "IPFS hash too long");
        
        roomMessageHashes[roomId].push(ipfsHash);
        
        emit MessageAdded(roomId, ipfsHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get all message hashes for a room
     * @param roomId ID of the room
     * @return Array of IPFS hashes
     */
    function getRoomMessages(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        returns (string[] memory) 
    {
        require(isMember[roomId][msg.sender], "Not a room member");
        return roomMessageHashes[roomId];
    }
    
    /**
     * @dev Get room details
     * @param roomId ID of the room
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
     * @dev Get all members of a room
     * @param roomId ID of the room
     */
    function getRoomMembers(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        returns (address[] memory) 
    {
        return roomMembers[roomId];
    }
    
    /**
     * @dev Get total message count for a room
     * @param roomId ID of the room
     */
    function getRoomMessageCount(uint256 roomId) 
        external 
        view 
        roomExists(roomId) 
        returns (uint256) 
    {
        return roomMessageHashes[roomId].length;
    }
    
    /**
     * @dev Check if user can join a room
     * @param roomId ID of the room
     * @param user Address to check
     */
    function canJoinRoom(uint256 roomId, address user) 
        external 
        view 
        roomExists(roomId) 
        returns (bool) 
    {
        if (isMember[roomId][user]) {
            return false; // Already a member
        }
        
        Room memory room = rooms[roomId];
        
        if (room.isNFTGated) {
            return IERC721(room.nftContract).balanceOf(user) > 0;
        }
        
        return true;
    }
    
    /**
     * @dev Deactivate a room (only creator)
     * @param roomId ID of the room
     */
    function deactivateRoom(uint256 roomId) 
        external 
        roomExists(roomId) 
        onlyRoomCreator(roomId) 
    {
        rooms[roomId].isActive = false;
        emit RoomDeactivated(roomId, msg.sender);
    }
    
    /**
     * @dev Get all active rooms
     */
    function getActiveRooms() external view returns (Room[] memory) {
        uint256 activeCount = 0;
        
        // Count active rooms
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active rooms
        Room[] memory activeRooms = new Room[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].isActive) {
                activeRooms[index] = rooms[i];
                index++;
            }
        }
        
        return activeRooms;
    }
    
    /**
     * @dev Get rooms where user is a member
     * @param user Address to check
     */
    function getUserRooms(address user) external view returns (uint256[] memory) {
        uint256 memberCount = 0;
        
        // Count rooms where user is member
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].isActive && isMember[i][user]) {
                memberCount++;
            }
        }
        
        // Create array of room IDs
        uint256[] memory userRoomIds = new uint256[](memberCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < roomCount; i++) {
            if (rooms[i].isActive && isMember[i][user]) {
                userRoomIds[index] = i;
                index++;
            }
        }
        
        return userRoomIds;
    }
}
