const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment script for DeChat contract
 * 
 * This script:
 * 1. Deploys the DeChat contract
 * 2. Saves the contract address and ABI
 * 3. Verifies the contract on Etherscan (if on testnet/mainnet)
 */
async function main() {
  console.log("🚀 Starting DeChat contract deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy DeChat contract
  console.log("📦 Deploying DeChat contract...");
  const DeChat = await hre.ethers.getContractFactory("DeChat");
  const deChat = await DeChat.deploy();
  
  await deChat.waitForDeployment();
  const contractAddress = await deChat.getAddress();
  
  console.log("✅ DeChat deployed to:", contractAddress);
  console.log("⛽ Deployment transaction:", deChat.deploymentTransaction().hash);
  console.log("\n");

  // Save contract address and ABI
  const contractsDir = path.join(__dirname, "../../src/contracts");
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    path.join(contractsDir, "DeChat-address.json"),
    JSON.stringify({ address: contractAddress }, null, 2)
  );

  // Save contract ABI
  const artifact = await hre.artifacts.readArtifact("DeChat");
  fs.writeFileSync(
    path.join(contractsDir, "DeChat.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("💾 Contract address and ABI saved to src/contracts/\n");

  // Wait for block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await deChat.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!\n");

  // Verify on Etherscan (if on testnet/mainnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan\n");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually later\n");
    }
  }

  // Summary
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("Contract: DeChat");
  console.log("Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("=" .repeat(60));
  console.log("\n📋 Contract Features:");
  console.log("✅ Room Management (create, delete, get)");
  console.log("✅ Room Membership (join, add members)");
  console.log("✅ Group Messaging (send, get messages)");
  console.log("✅ Private Messaging (1-on-1 chat)");
  console.log("✅ Event Logging (all activities tracked)");
  
  if (hre.network.name === "sepolia") {
    console.log("\n🔗 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (hre.network.name === "mainnet") {
    console.log("\n🔗 View on Etherscan:");
    console.log(`https://etherscan.io/address/${contractAddress}`);
  }
  
  console.log("\n💡 Next Steps:");
  console.log("1. Update your frontend to use the new contract");
  console.log("2. Test contract functions on Remix or Hardhat");
  console.log("3. Create test rooms and send messages");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
