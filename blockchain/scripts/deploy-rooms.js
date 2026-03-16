const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting DechatRooms deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy DechatRooms contract
  console.log("📦 Deploying DechatRooms contract...");
  const DechatRooms = await hre.ethers.getContractFactory("DechatRooms");
  const dechatRooms = await DechatRooms.deploy();
  
  await dechatRooms.waitForDeployment();
  const contractAddress = await dechatRooms.getAddress();
  
  console.log("✅ DechatRooms deployed to:", contractAddress);
  console.log("⛽ Deployment transaction:", dechatRooms.deploymentTransaction().hash);
  console.log("\n");

  // Save contract address and ABI
  const contractsDir = path.join(__dirname, "../../src/contracts");
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save contract address
  fs.writeFileSync(
    path.join(contractsDir, "DechatRooms-address.json"),
    JSON.stringify({ address: contractAddress }, null, 2)
  );

  // Save contract ABI
  const artifact = await hre.artifacts.readArtifact("DechatRooms");
  fs.writeFileSync(
    path.join(contractsDir, "DechatRooms.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("💾 Contract address and ABI saved to src/contracts/\n");

  // Wait for block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await dechatRooms.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!\n");

  // Verify on Etherscan (Sepolia)
  if (hre.network.name === "sepolia") {
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
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("=" .repeat(60));
  console.log("\n📋 Next steps:");
  console.log("1. Update your frontend with the contract address");
  console.log("2. Test contract functions on Sepolia testnet");
  console.log("3. Create test rooms and send messages");
  console.log("\n🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
