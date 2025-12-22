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
    "name": "FailedDeployment",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "InsufficientBalance",
    "type": "error"
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
    "name": "createWalletCore",
    "outputs": [
      {
        "internalType": "address",
        "name": "keyVault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "storage_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
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
      },
      {
        "internalType": "address",
        "name": "customLogicImpl",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "logicData",
        "type": "bytes"
      }
    ],
    "name": "createWalletWithCustomLogic",
    "outputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "keyVault",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
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
      },
      {
        "internalType": "address",
        "name": "hook",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "hookData",
        "type": "bytes"
      }
    ],
    "name": "createWalletWithHook",
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

module.exports = {
  WALLET_FACTORY_ABI,
  getWalletFactoryContract,
};

