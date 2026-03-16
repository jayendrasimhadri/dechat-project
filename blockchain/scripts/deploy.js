const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying DeChat contract...");

  const DeChat = await hre.ethers.getContractFactory("DeChat");
  const dechat = await DeChat.deploy();
  await dechat.waitForDeployment();

  const address = await dechat.getAddress();
  console.log(`✅ DeChat contract deployed to: ${address}`);

  // ── Update root .env with new contract address ─────────────────────────────
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('REACT_APP_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /REACT_APP_CONTRACT_ADDRESS=.*/,
        `REACT_APP_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nREACT_APP_CONTRACT_ADDRESS=${address}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`📝 Updated .env with new contract address`);
  }

  // ── Copy ABI to frontend src/contracts/DeChat.json ─────────────────────────
  const contractsDir = path.join(__dirname, '../../src/contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    '../artifacts/contracts/DeChat.sol/DeChat.json'
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  fs.writeFileSync(
    path.join(contractsDir, 'DeChat.json'),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log(`📄 ABI saved to src/contracts/DeChat.json`);
  console.log(`\n🎉 Done!`);
  console.log(`   Contract : ${address}`);
  console.log(`   Network  : ${hre.network.name}`);
  console.log(`\n⚠️  Make sure MetaMask is on "Hardhat Local" (Chain ID 31337, RPC http://127.0.0.1:8545)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
