/**
 * KeyVault Contract Interface
 * 
 * Typed contract getter for the KeyVault contract
 */

const { ConfigError } = require('../../errors');

/**
 * KeyVault contract ABI
 */
const KEYVAULT_ABI = [
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
      "name": "DelegateCallFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidAccessToken",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidAuthenticator",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidImplementation",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotInitialized",
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
      "name": "ImplementationUpgraded",
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
          "internalType": "bytes",
          "name": "implCall",
          "type": "bytes"
        }
      ],
      "name": "executeWithAuth",
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
          "name": "_storage",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_authenticator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_implementation",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "accessToken",
          "type": "bytes32"
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
          "name": "txData",
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
          "name": "signedTx",
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
      "name": "upgradeImplementation",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];
    
/**
 * Get keyVault contract instance
 * 
 * @param {Object} signerOrProvider - Ethers Signer or Provider
 * @param {String} keyVaultAddress - KeyVault contract address
 * @returns {Object} Contract instance
 */
function getKeyVaultContract(signerOrProvider, keyVaultAddress) {
    const { ethers } = require('ethers');
    
    if (!keyVaultAddress) {
      throw new ConfigError('KeyVault address is required', 'keyVaultAddress');
    }
    
    return new ethers.Contract(keyVaultAddress, KEYVAULT_ABI, signerOrProvider);
}

module.exports = {
    KEYVAULT_ABI,
    getKeyVaultContract,
};
    