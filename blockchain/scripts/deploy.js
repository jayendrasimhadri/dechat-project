const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Chat contract...");

  // Get the contract factory
  const Chat = await hre.ethers.getContractFactory("Chat");
  
  // Deploy the contract
  const chat = await Chat.deploy();

  // Wait for deployment to finish
  await chat.waitForDeployment();

  // Get the deployed contract address
  const address = await chat.getAddress();
  console.log(`✅ Chat contract deployed to: ${address}`);
  
  // Save the contract address for frontend
  const contractsDir = path.join(__dirname, '../../src/contracts');
  
  // Create contracts directory if it doesn't exist
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Save contract address
  const contractAddress = {
    Chat: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(contractsDir, 'contractAddress.json'),
    JSON.stringify(contractAddress, null, 2)
  );
  
  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, '../artifacts/contracts/Chat.sol/Chat.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  fs.writeFileSync(
    path.join(contractsDir, 'Chat.json'),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );
  
  console.log("📄 Contract address and ABI saved to frontend!");
  console.log(`📁 Location: src/contracts/`);
  console.log(`\n🎉 Deployment complete!`);
  console.log(`\nContract Address: ${address}`);
  console.log(`Network: ${hre.network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
