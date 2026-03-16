const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chat Contract", function () {
  let chat;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy contract
    const Chat = await ethers.getContractFactory("Chat");
    chat = await Chat.deploy();
    await chat.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await chat.getAddress();
      expect(address).to.not.equal(0);
      expect(address).to.not.equal("");
      expect(address).to.not.equal(null);
      expect(address).to.not.equal(undefined);
    });

    it("Should start with zero messages", async function () {
      const count = await chat.getMessagesCount();
      expect(count).to.equal(0);
    });
  });

  describe("Sending Messages", function () {
    it("Should send a message successfully", async function () {
      const ipfsCID = "QmTest123ABC...";
      
      await chat.sendMessage(ipfsCID);
      
      const count = await chat.getMessagesCount();
      expect(count).to.equal(1);
    });

    it("Should emit MessageSent event", async function () {
      const ipfsCID = "QmTest123ABC...";
      
      await expect(chat.sendMessage(ipfsCID))
        .to.emit(chat, "MessageSent")
        .withArgs(owner.address, ipfsCID, await getBlockTimestamp());
    });

    it("Should allow multiple messages", async function () {
      await chat.sendMessage("QmTest1...");
      await chat.sendMessage("QmTest2...");
      await chat.sendMessage("QmTest3...");
      
      const count = await chat.getMessagesCount();
      expect(count).to.equal(3);
    });

    it("Should allow different users to send messages", async function () {
      await chat.connect(owner).sendMessage("QmOwner...");
      await chat.connect(addr1).sendMessage("QmAddr1...");
      await chat.connect(addr2).sendMessage("QmAddr2...");
      
      const count = await chat.getMessagesCount();
      expect(count).to.equal(3);
    });
  });

  describe("Retrieving Messages", function () {
    beforeEach(async function () {
      // Send some test messages
      await chat.connect(owner).sendMessage("QmTest1...");
      await chat.connect(addr1).sendMessage("QmTest2...");
    });

    it("Should retrieve a message correctly", async function () {
      const [sender, ipfsCID, timestamp] = await chat.getMessage(0);
      
      expect(sender).to.equal(owner.address);
      expect(ipfsCID).to.equal("QmTest1...");
      expect(timestamp).to.be.gt(0);
    });

    it("Should retrieve multiple messages", async function () {
      const [sender1, cid1] = await chat.getMessage(0);
      const [sender2, cid2] = await chat.getMessage(1);
      
      expect(sender1).to.equal(owner.address);
      expect(cid1).to.equal("QmTest1...");
      expect(sender2).to.equal(addr1.address);
      expect(cid2).to.equal("QmTest2...");
    });

    it("Should revert for invalid index", async function () {
      await expect(chat.getMessage(999))
        .to.be.revertedWith("Invalid index");
    });

    it("Should return correct message count", async function () {
      const count = await chat.getMessagesCount();
      expect(count).to.equal(2);
    });
  });

  describe("Message Data Integrity", function () {
    it("Should store sender address correctly", async function () {
      await chat.connect(addr1).sendMessage("QmTest...");
      
      const [sender] = await chat.getMessage(0);
      expect(sender).to.equal(addr1.address);
    });

    it("Should store IPFS CID correctly", async function () {
      const testCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
      await chat.sendMessage(testCID);
      
      const [, ipfsCID] = await chat.getMessage(0);
      expect(ipfsCID).to.equal(testCID);
    });

    it("Should store timestamp correctly", async function () {
      const beforeTimestamp = await getBlockTimestamp();
      await chat.sendMessage("QmTest...");
      const afterTimestamp = await getBlockTimestamp();
      
      const [, , timestamp] = await chat.getMessage(0);
      expect(timestamp).to.be.gte(beforeTimestamp);
      expect(timestamp).to.be.lte(afterTimestamp);
    });
  });

  // Helper function to get current block timestamp
  async function getBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});
