/**
 * Wallet Signature Authenticator Contract Interface
 * 
 * Typed contract getter for the WalletSignatureAuthenticator contract
 */

/**
 * Wallet signature authenticator contract ABI
 */
const WALLET_SIGNATURE_AUTHENTICATOR_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyConfigured",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "ECDSAInvalidSignatureS",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyWhitelist",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpiredSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotConfigured",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotWhitelisted",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "str",
        "type": "string"
      }
    ],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
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
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "added",
        "type": "address"
      }
    ],
    "name": "AddressAdded",
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
        "name": "removed",
        "type": "address"
      }
    ],
    "name": "AddressRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
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
        "indexed": false,
        "internalType": "address[]",
        "name": "initialWhitelist",
        "type": "address[]"
      }
    ],
    "name": "WalletConfigured",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "AUTH_TYPEHASH",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
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
      },
      {
        "internalType": "address",
        "name": "newAddress",
        "type": "address"
      }
    ],
    "name": "addToWhitelist",
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
    "inputs": [],
    "name": "domainSeparator",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
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
    "name": "getWhitelist",
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
        "internalType": "address",
        "name": "addr",
        "type": "address"
      }
    ],
    "name": "isWhitelisted",
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
      },
      {
        "internalType": "address",
        "name": "addressToRemove",
        "type": "address"
      }
    ],
    "name": "removeFromWhitelist",
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
 * Get wallet signature authenticator contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} walletSignatureAuthenticatorAddress - Wallet signature authenticator contract address
 * @returns {Object} Contract instance
 */
function getWalletSignatureAuthenticatorContract(signerOrProvider, walletSignatureAuthenticatorAddress) {
    const { ethers } = require('ethers');

    if (!walletSignatureAuthenticatorAddress) {
        throw new Error('Wallet logic address is required');
    }

    return new ethers.Contract(walletSignatureAuthenticatorAddress, WALLET_SIGNATURE_AUTHENTICATOR_ABI, signerOrProvider);
}

/**
 * Parse WhitelistRemoved event from transaction receipt
 * 
 * @param {Object} receipt - Transaction receipt
 * @param {Object} walletSignatureAuthenticatorContract - Wallet signature authenticator contract instance
 * @returns {Object|null} Parsed event data or null if not found
 */
function parseWhitelistRemovedEvent(receipt, walletSignatureAuthenticatorContract) {
    if (!receipt || !receipt.logs) {
        return null;
    }

    const iface = walletSignatureAuthenticatorContract.interface;

    // Find the WhitelistRemoved event
    const whitelistRemovedEvent = receipt.logs.find((log) => {
        try {
            const parsed = iface.parseLog(log);
            return parsed?.name === 'AddressRemoved';
        } catch {
            return false;
        }
    });

    if (!whitelistRemovedEvent) {
        // Debug: log all events to see what we're getting
        console.log('[parseWhitelistRemovedEvent] Total logs:', receipt.logs?.length);
        if (receipt.logs && receipt.logs.length > 0) {
          console.log('[parseWhitelistRemovedEvent] Trying to parse logs...');
          receipt.logs.forEach((log, i) => {
            try {
              const parsed = iface.parseLog(log);
              console.log(`[parseWhitelistRemovedEvent] Log ${i}:`, parsed?.name || 'unknown');
            } catch (e) {
              console.log(`[parseWhitelistRemovedEvent] Log ${i}: failed to parse (not from walletSignatureAuthenticator)`);
            }
          });
        }
        return null;
    } else {
        console.log('[parseWhitelistRemovedEvent] WhitelistRemoved event found');
    }

    // Parse the event
    try {
        const parsedEvent = iface.parseLog(whitelistRemovedEvent);
        if (!parsedEvent || parsedEvent.name !== 'AddressRemoved') {
            return null;
        }

        return {
            wallet: parsedEvent.args?.wallet,
            removed: parsedEvent.args?.removed,
        };
    } catch (error) {
        // Failed to parse event
        console.error('[parseWhitelistRemovedEvent] Error parsing event:', error.message);
        return null;
    }
}

module.exports = {
    WALLET_SIGNATURE_AUTHENTICATOR_ABI,
    getWalletSignatureAuthenticatorContract,
    parseWhitelistRemovedEvent
};