/**
 * Wallet Contract ABI and helper methods
 * 
 * This file contains the contract ABI and helper functions for interacting
 * with the wallet contract.
 */

/**
 * Wallet Contract ABI
 * Contains the createUser method and other wallet-related methods
 */
const WALLET_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "secret",
        "type": "bytes"
      }
    ],
    "name": "createUser",
    "outputs": [
      {
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "publicKey",
        "type": "bytes"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "userAddress",
        "type": "address"
      }
    ],
    "name": "UserCreated",
    "type": "event"
  }
  // Add other contract methods here as needed
];

/**
 * Register wallet contract with contract client
 * 
 * @param {ContractClient} contractClient - Contract client instance
 * @param {String} contractAddress - Contract address
 */
function registerWalletContract(contractClient, contractAddress) {
  contractClient.registerContract('Wallet', contractAddress, WALLET_CONTRACT_ABI);
}

module.exports = {
  WALLET_CONTRACT_ABI,
  registerWalletContract
};

