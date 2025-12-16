/**
 * Wallet Logic Contract Interface
 * 
 * Typed contract getter for the WalletLogic contract
 */

/**
 * Wallet logic contract ABI
 */
const WALLET_LOGIC_ABI = [
  {
    "inputs": [],
    "name": "AlreadyInitialized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidKeyVault",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitialized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "newAuthenticator",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "newAuthConfig",
        "type": "bytes"
      }
    ],
    "name": "changeAuthenticator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      }
    ],
    "name": "getAccountAddress",
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
        "internalType": "uint32",
        "name": "fromIndex",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "count",
        "type": "uint32"
      }
    ],
    "name": "getAccountAddresses",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuthenticator",
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
    "name": "getKeyVault",
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
        "name": "_keyVault",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialized",
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
    "inputs": [],
    "name": "keyVault",
    "outputs": [
      {
        "internalType": "contract IKeyVault",
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
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "bytes32",
        "name": "digest",
        "type": "bytes32"
      }
    ],
    "name": "sign",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "message",
        "type": "bytes"
      }
    ],
    "name": "signMessage",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "index",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gasPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      }
    ],
    "name": "signTransaction",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      }
    ],
    "name": "upgradeKeyVault",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
  
  /**
   * Get wallet logic contract instance
   * 
   * @param {Object} signerOrProvider - Ethers Signer or Provider
   * @param {String} walletLogicAddress - Wallet logic contract address
   * @returns {Object} Contract instance
   */
  function getWalletLogicContract(signerOrProvider, walletLogicAddress) {
    const { ethers } = require('ethers');
    
    if (!walletLogicAddress) {
      throw new Error('Wallet logic address is required');
    }
    
    return new ethers.Contract(walletLogicAddress, WALLET_LOGIC_ABI, signerOrProvider);
  }

// Is actually a KeyVault contract event 
/**
 * Parse AuthenticatorChanged event from transaction receipt
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} walletLogicContract - Wallet logic contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseAuthenticatorChangedEvent(receipt, walletLogicContract) {
  if (!receipt || !receipt.logs) {
    return null;
  }
  
  const iface = walletLogicContract.interface;
  
  // Find the AuthenticatorChanged event
  const authenticatorChangedEvent = receipt.logs.find((log) => {
    try {
      const parsed = iface.parseLog(log);
      return parsed?.name === 'AuthenticatorChanged';
    } catch {
      return false;
    }
  });
  
  if (!authenticatorChangedEvent) {
    // Debug: log all events to see what we're getting
    console.log('[parseAuthenticatorChangedEvent] Total logs:', receipt.logs?.length);
    if (receipt.logs && receipt.logs.length > 0) {
      console.log('[parseAuthenticatorChangedEvent] Trying to parse logs...');
      receipt.logs.forEach((log, i) => {
        try {
          const parsed = iface.parseLog(log);
          console.log(`[parseAuthenticatorChangedEvent] Log ${i}:`, parsed?.name || 'unknown');
        } catch (e) {
          console.log(`[parseAuthenticatorChangedEvent] Log ${i}: failed to parse (not from logic)`);
        }
      });
    }
    return null;
  }
  
  // Parse the event
  try {
    const parsedEvent = iface.parseLog(authenticatorChangedEvent);
    
    if (!parsedEvent || parsedEvent.name !== 'AuthenticatorChanged') {
      return null;
    }

    return {
      oldAuth: parsedEvent.args?.oldAuth,
      newAuth: parsedEvent.args?.newAuth,
    };
  } catch (error) {
    // Failed to parse event
    console.error('[parseAuthenticatorChangedEvent] Error parsing event:', error.message);
    return null;
  }
}

// // Is actually a KeyVault contract event 
// /**
//  * Parse ImplementationUpgraded event from transaction receipt
//  * 
//  * @param {Object} receipt - Transaction receipt
//  * @param {Object} walletLogicContract - Wallet logic contract instance
//  * @returns {Object|null} Parsed event data or null if not found
//  */
// function parseImplementationUpgradedEvent(receipt, walletLogicContract) {
//   if (!receipt || !receipt.logs) {
//     return null;
//   }
  
//   const iface = walletLogicContract.interface;
  
//   // Find the ImplementationUpgraded event
//   const implementationUpgradedEvent = receipt.logs.find((log) => {
//     try {
//       const parsed = iface.parseLog(log);
//       return parsed?.name === 'ImplementationUpgraded';
//     } catch {
//       return false;
//     }
//   });
  
//   if (!implementationUpgradedEvent) {
//     // Debug: log all events to see what we're getting
//     console.log('[parseImplementationUpgradedEvent] Total logs:', receipt.logs?.length);
//     if (receipt.logs && receipt.logs.length > 0) {
//       console.log('[parseImplementationUpgradedEvent] Trying to parse logs...');
//       receipt.logs.forEach((log, i) => {
//         try {
//           const parsed = iface.parseLog(log);
//           console.log(`[parseImplementationUpgradedEvent] Log ${i}:`, parsed?.name || 'unknown');
//         } catch (e) {
//           console.log(`[parseImplementationUpgradedEvent] Log ${i}: failed to parse (not from logic)`);
//         }
//       });
//     }
//     return null;
//   }
  
//   // Parse the event
//   try {
//     const parsedEvent = iface.parseLog(implementationUpgradedEvent);
//     if (!parsedEvent || parsedEvent.name !== 'ImplementationUpgraded') {
//       return null;
//     }

//     return {
//       oldImpl: parsedEvent.args?.oldImpl,
//       newImplementation: parsedEvent.args?.newImplementation,
//     };
//   } catch (error) {
//     // Failed to parse event
//     console.error('[parseImplementationUpgradedEvent] Error parsing event:', error.message);
//     return null;
//   }
// }

  module.exports = {
    WALLET_LOGIC_ABI,
    getWalletLogicContract,
    parseAuthenticatorChangedEvent,
    // parseImplementationUpgradedEvent
  };
  
  