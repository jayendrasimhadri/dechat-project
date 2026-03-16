// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Chat {
    
    struct Message {
        address sender;
        string ipfsCID;
        uint256 timestamp;
    }
    
    Message[] private messages;
    
    event MessageSent(
        address indexed sender,
        string ipfsCID,
        uint256 timestamp
    );
    
    function sendMessage(string memory _ipfsCID) external {
        messages.push(
            Message({
                sender: msg.sender,
                ipfsCID: _ipfsCID,
                timestamp: block.timestamp
            })
        );
        
        emit MessageSent(msg.sender, _ipfsCID, block.timestamp);
    }
    
    function getMessagesCount() external view returns (uint256) {
        return messages.length;
    }
    
    function getMessage(uint256 index)
        external
        view
        returns (address, string memory, uint256)
    {
        require(index < messages.length, "Invalid index");
        Message memory msgData = messages[index];
        return (msgData.sender, msgData.ipfsCID, msgData.timestamp);
    }
}
