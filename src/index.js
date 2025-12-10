/**
 * Arnacon Wallet SDK
 * 
 * JavaScript SDK for wallet operations through smart contract interactions.
 * 
 * Main exports:
 * - Wallet: Main wallet class for creating and managing wallets
 * - ContractClient: Low-level contract interaction client
 */

const Wallet = require('./core/Wallet');
const ContractClient = require('./core/contracts/ContractClient');

// Contract ABIs and helpers
const { WALLET_CONTRACT_ABI, registerWalletContract } = require('./contracts/WalletContract');

// Errors
const {
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
} = require('./errors/WalletError');

// Utilities
const {
  validateAddress,
  validateUsername,
  validateSecret,
  validatePrivateKey,
  validateRpcUrl
} = require('./utils/validation');

/**
 * Arnacon Wallet SDK
 * 
 * Simple entry point for wallet operations through smart contract interactions.
 * 
 * @example
 * ```javascript
 * const { Wallet } = require('@arnacon/wallet-sdk');
 * 
 * const wallet = await Wallet.create({
 *   username: 'alice',
 *   secret: 'my-secret',
 *   contractAddress: '0x...',
 *   rpcUrl: 'https://...',
 *   signerPrivateKey: '0x...'
 * });
 * ```
 */
module.exports = {
  // Main classes
  Wallet,
  ContractClient,
  
  // Contract helpers
  WALLET_CONTRACT_ABI,
  registerWalletContract,
  
  // Errors (for error handling)
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError,
  
  // Utilities (for advanced usage)
  validateAddress,
  validateUsername,
  validateSecret,
  validatePrivateKey,
  validateRpcUrl
};
