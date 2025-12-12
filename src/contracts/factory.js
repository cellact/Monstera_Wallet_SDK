/**
 * Wallet Factory Contract Interface
 * 
 * Typed contract getter for the WalletFactory contract
 */

/**
 * Factory contract ABI (minimal - only methods we use)
 */
const FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "seed",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "authenticator",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "authConfig",
        "type": "bytes"
      }
    ],
    "name": "createWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "authenticator",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "authenticator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "seed",
        "type": "bytes"
      }
    ],
    "name": "WalletCreated",
    "type": "event"
  }
];

/**
 * Get factory contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} factoryAddress - Factory contract address
 * @returns {Object} Contract instance
 */
function getFactoryContract(signerOrProvider, factoryAddress) {
  const { ethers } = require('ethers');
  
  if (!factoryAddress) {
    throw new Error('Factory address is required');
  }
  
  return new ethers.Contract(factoryAddress, FACTORY_ABI, signerOrProvider);
}

/**
 * Parse WalletCreated event from transaction receipt
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} factoryContract - Factory contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseWalletCreatedEvent(receipt, factoryContract) {
  if (!receipt || !receipt.logs) {
    return null;
  }
  
  const iface = factoryContract.interface;
  
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === 'WalletCreated') {
        return {
          wallet: parsed.args.wallet,
          authenticator: parsed.args.authenticator,
          seed: parsed.args.seed
        };
      }
    } catch (e) {
      // Not the event we're looking for, continue
      continue;
    }
  }
  
  return null;
}

module.exports = {
  FACTORY_ABI,
  getFactoryContract,
  parseWalletCreatedEvent
};

