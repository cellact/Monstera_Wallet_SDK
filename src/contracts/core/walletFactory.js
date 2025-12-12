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

