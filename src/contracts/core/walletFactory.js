/**
 * Wallet Factory Contract Interface
 * 
 * Typed contract getter for the WalletFactory contract
 */

/**
 * Factory contract ABI (minimal - only methods we use)
 */
const WALLET_FACTORY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSeedLength",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldImpl",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newImpl",
        "type": "address"
      }
    ],
    "name": "BeaconUpgraded",
    "type": "event"
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
        "name": "keyVault",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "storage_",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "authenticator",
        "type": "address"
      }
    ],
    "name": "WalletCreated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "beacon",
    "outputs": [
      {
        "internalType": "contract UpgradeableBeacon",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
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
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultKeyVaultImpl",
    "outputs": [
      {
        "internalType": "contract KeyVaultImplementation",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDefaultKeyVaultImpl",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "implementation",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "isWallet",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "transferAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newLogic",
        "type": "address"
      }
    ],
    "name": "upgradeLogic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "walletCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "walletKeyVault",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "walletStorage",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "wallets",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Get wallet factory contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} walletFactoryAddress - Wallet factory contract address
 * @returns {Object} Contract instance
 */
function getWalletFactoryContract(signerOrProvider, walletFactoryAddress) {
  const { ethers } = require('ethers');
  
  if (!walletFactoryAddress) {
    throw new Error('Wallet factory address is required');
  }
  
  return new ethers.Contract(walletFactoryAddress, WALLET_FACTORY_ABI, signerOrProvider);
}

/**
 * Parse WalletCreated event from transaction receipt
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} walletFactoryContract - Wallet factory contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseWalletCreatedEvent(receipt, walletFactoryContract) {
  if (!receipt || !receipt.logs) {
    return null;
  }
  
  const iface = walletFactoryContract.interface;
  
  // Find the WalletCreated event
  const walletCreatedEvent = receipt.logs.find((log) => {
    try {
      const parsed = iface.parseLog(log);
      return parsed?.name === 'WalletCreated';
    } catch {
      return false;
    }
  });
  
  if (!walletCreatedEvent) {
    // Debug: log all events to see what we're getting
    console.log('[parseWalletCreatedEvent] Total logs:', receipt.logs?.length);
    if (receipt.logs && receipt.logs.length > 0) {
      console.log('[parseWalletCreatedEvent] Trying to parse logs...');
      receipt.logs.forEach((log, i) => {
        try {
          const parsed = iface.parseLog(log);
          console.log(`[parseWalletCreatedEvent] Log ${i}:`, parsed?.name || 'unknown');
        } catch (e) {
          console.log(`[parseWalletCreatedEvent] Log ${i}: failed to parse (not from factory)`);
        }
      });
    }
    return null;
  }
  
  // Parse the event
  try {
    const parsedEvent = iface.parseLog(walletCreatedEvent);
    
    if (!parsedEvent || parsedEvent.name !== 'WalletCreated') {
      return null;
    }

    return {
      wallet: parsedEvent.args?.wallet,
      keyVault: parsedEvent.args?.keyVault,
      storage: parsedEvent.args?.storage_, // Note: field name is storage_ in contract
      authenticator: parsedEvent.args?.authenticator
    };
  } catch (error) {
    // Failed to parse event
    console.error('[parseWalletCreatedEvent] Error parsing event:', error.message);
    return null;
  }
}

module.exports = {
  WALLET_FACTORY_ABI,
  getWalletFactoryContract,
  parseWalletCreatedEvent
};

