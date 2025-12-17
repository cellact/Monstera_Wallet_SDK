/**
 * Password Authenticator Contract Interface
 * 
 * Typed contract getter for the PasswordAuthenticator contract
 */

/**
 * Password authenticator contract ABI
 */
const PASSWORD_AUTHENTICATOR_ABI = [
  {
    "inputs": [],
    "name": "AlreadyConfigured",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPassword",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotConfigured",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "PasswordChanged",
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
      }
    ],
    "name": "PasswordConfigured",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "currentPassword",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "newPasswordHash",
        "type": "bytes32"
      }
    ],
    "name": "changePassword",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "config",
        "type": "bytes"
      }
    ],
    "name": "configure",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "isConfigured",
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
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "authProof",
        "type": "bytes"
      }
    ],
    "name": "verify",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
  
/**
 * Get password authenticator contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} passwordAuthenticatorAddress - Password authenticator contract address
 * @returns {Object} Contract instance
 */
function getPasswordAuthenticatorContract(signerOrProvider, passwordAuthenticatorAddress) {
    const { ethers } = require('ethers');

    if (!passwordAuthenticatorAddress) {
        throw new Error('Wallet logic address is required');
    }

    return new ethers.Contract(passwordAuthenticatorAddress, PASSWORD_AUTHENTICATOR_ABI, signerOrProvider);
}

/**
 * Parse PasswordChanged event
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} passwordAuthContract - Password authenticator contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parsePasswordChangedEvent(receipt, passwordAuthContract) {
    if (!receipt || !receipt.logs) {
        return null;
    }

    const iface = passwordAuthContract.interface;

    const passwordChangedEvent = receipt.logs.find((log) => {
      try {
        const parsed = iface.parseLog(log);
        return parsed?.name === 'PasswordChanged';
      } catch {
        return false;
      }
    });

    if (!passwordChangedEvent) {
        // Debug: log all events to see what we're getting
        console.log('[parsePasswordChangedEvent] Total logs:', receipt.logs?.length);
        if (receipt.logs && receipt.logs.length > 0) {
          console.log('[parsePasswordChangedEvent] Trying to parse logs...');
          receipt.logs.forEach((log, i) => {
            try {
              const parsed = iface.parseLog(log);
              console.log(`[parsePasswordChangedEvent] Log ${i}:`, parsed?.name || 'unknown');
            } catch (e) {
              console.log(`[parsePasswordChangedEvent] Log ${i}: failed to parse (not from passwordAuth)`);
            }
          });
        }
        return null;
    }

    // Parse the event
    try {
      const parsedEvent = iface.parseLog(passwordChangedEvent);
      if (!parsedEvent || parsedEvent.name !== 'PasswordChanged') {
        return null;
      }

      return {
        wallet: parsedEvent.args?.wallet,
      };
    } catch (error) {
      // Failed to parse event
      console.error('[parsePasswordChangedEvent] Error parsing event:', error.message);
      return null;
    }
}

module.exports = {
    PASSWORD_AUTHENTICATOR_ABI,
    getPasswordAuthenticatorContract,
    parsePasswordChangedEvent
};
  
  