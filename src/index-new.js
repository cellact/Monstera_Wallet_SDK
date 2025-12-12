/**
 * Sapphire Wallet SDK - New Architecture
 * 
 * Main exports for the new SDK structure
 */

const SapphireWalletSDK = require('./client/SapphireWalletSDK');

// Export config utilities
const { NETWORKS, createSdkConfig } = require('./config/networks');

// Export provider utilities
const { getReadProvider, getWriteSigner } = require('./provider/sapphire');

// Export crypto utilities
const { generateMnemonic, deriveSeed, hashPassword } = require('./crypto/wallet');

// Export contract utilities
const { getFactoryContract } = require('./contracts/factory');
const { getWalletLogicContract } = require('./contracts/walletLogic');

// Export errors (existing)
const {
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
} = require('./errors/WalletError');

module.exports = {
  // Main SDK class
  SapphireWalletSDK,
  
  // Config utilities
  NETWORKS,
  createSdkConfig,
  
  // Provider utilities
  getReadProvider,
  getWriteSigner,
  
  // Crypto utilities
  generateMnemonic,
  deriveSeed,
  hashPassword,
  
  // Contract utilities
  getFactoryContract,
  getWalletLogicContract,
  
  // Errors
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
};

