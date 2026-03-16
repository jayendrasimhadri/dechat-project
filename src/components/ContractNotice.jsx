import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

const ContractNotice = () => {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Smart Contract Not Deployed
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              The messaging app is currently working with IPFS only. 
              To enable blockchain features (rooms, NFT gating, on-chain message hashes), 
              you need to deploy the smart contract.
            </p>
            <div className="mt-3">
              <p className="font-medium">Quick Deploy:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Configure <code className="bg-yellow-100 px-1 rounded">blockchain/.env</code> with Sepolia credentials</li>
                <li>Get Sepolia ETH from <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">faucets <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                <li>Run: <code className="bg-yellow-100 px-1 rounded">cd blockchain && npx hardhat run scripts/deploy-rooms.js --network sepolia</code></li>
              </ol>
            </div>
            <div className="mt-3">
              <a 
                href="/blockchain/SEPOLIA_DEPLOYMENT.md" 
                className="text-yellow-800 font-medium underline inline-flex items-center"
              >
                View Deployment Guide <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractNotice;
