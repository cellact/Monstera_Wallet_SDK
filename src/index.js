/**
 * Monstera SDK - Main Entry Point
 * 
 * Main exports for the new SDK structure
 */

const Monstera = require('./client/Monstera');

// Export config utilities
const { NETWORKS, createSdkConfig } = require('./config/networks');

// Export provider utilities
const { getReadProvider, getWriteSigner } = require('./provider/sapphire');

// Export crypto utilities
const { generateMnemonic, deriveSeed, hashPassword } = require('./crypto/wallet');

// Export contract utilities
const { getWalletFactoryContract } = require('./contracts/core/walletFactory');
const { getWalletLogicContract } = require('./contracts/core/walletLogic');
const { getWalletSignatureAuthenticatorContract } = require('./contracts/authenticators/WalletSignatureAuthenticator');
const { getKeyVaultContract } = require('./contracts/core/keyVault');
const { getPasswordAuthenticatorContract } = require('./contracts/authenticators/PasswordAuthenticator');

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
  Monstera,
  
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
  getWalletFactoryContract,
  getWalletLogicContract,
  getWalletSignatureAuthenticatorContract,
  getKeyVaultContract,
  getPasswordAuthenticatorContract,
  
  // Errors
  WalletError,
  ContractError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  TransactionError
};

