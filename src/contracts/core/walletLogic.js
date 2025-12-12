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
      "name": "AuthenticationFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "DER_Split_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidAuthenticator",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitialized",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "expmod_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "k256Decompress_Invalid_Length_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "k256DeriveY_Invalid_Prefix_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "recoverV_Error",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "oldAuth",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newAuth",
          "type": "address"
        }
      ],
      "name": "AuthenticatorChanged",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "authenticator",
      "outputs": [
        {
          "internalType": "contract IAuthenticator",
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
          "internalType": "bytes",
          "name": "authProof",
          "type": "bytes"
        },
        {
          "internalType": "uint32",
          "name": "index",
          "type": "uint32"
        }
      ],
      "name": "getAccount",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "privateKey",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "_storage",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_authenticator",
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
      "inputs": [],
      "name": "storage_",
      "outputs": [
        {
          "internalType": "contract WalletStorage",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
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
  
  module.exports = {
    WALLET_LOGIC_ABI,
    getWalletLogicContract
  };
  
  