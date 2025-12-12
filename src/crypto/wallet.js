/**
 * Wallet Crypto Utilities
 * 
 * Handles mnemonic generation, seed derivation, and auth config encoding
 */

const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Generate a new mnemonic phrase
 * 
 * @param {Number} [strength=128] - Entropy strength (128 for 12 words, 256 for 24 words)
 * @returns {String} BIP39 mnemonic phrase
 */
function generateMnemonic(strength = 128) {
  // Use ethers to generate mnemonic (BIP39 compliant)
  // ethers v6: Create random wallet and extract mnemonic
  const wallet = ethers.Wallet.createRandom();
  
  if (!wallet.mnemonic) {
    throw new Error('Failed to generate mnemonic from random wallet');
  }
  
  return wallet.mnemonic.phrase;
}

/**
 * Derive seed from mnemonic using PBKDF2
 * 
 * @param {String} mnemonic - BIP39 mnemonic phrase
 * @param {String} [password=''] - Optional password for seed derivation
 * @param {Number} [iterations=2048] - PBKDF2 iterations
 * @returns {Buffer} Derived seed (64 bytes)
 */
function deriveSeed(mnemonic, password = '', iterations = 2048) {
  // Normalize mnemonic (remove extra whitespace)
  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Use PBKDF2 to derive seed (same as Hardhat script)
  const seed = crypto.pbkdf2Sync(
    normalizedMnemonic,
    `mnemonic${password}`, // Salt format: "mnemonic" + password
    2048, // iterations
    64,   // key length (512 bits = 64 bytes)
    'sha512'
  );
  
  return seed;
}

/**
 * Hash password using keccak256
 * 
 * @param {String} password - Password to hash
 * @returns {String} Keccak256 hash as hex string (0x prefixed)
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  // Use ethers to hash with keccak256
  return ethers.keccak256(ethers.toUtf8Bytes(password));
}

/**
 * Encode auth config for contract call
 * 
 * @param {String} authenticatorAddress - Address of the authenticator contract
 * @param {String} authConfig - Auth configuration (e.g., password hash)
 * @returns {String} Encoded auth config
 */
function encodeAuthConfig(authenticatorAddress, authConfig) {
  // For password auth, authConfig is the password hash
  // The contract expects: (address authenticator, bytes authConfig)
  // We'll return the authConfig as-is (it's already a hex string)
  
  if (!authenticatorAddress || !/^0x[a-fA-F0-9]{40}$/.test(authenticatorAddress)) {
    throw new Error('Invalid authenticator address');
  }
  
  if (!authConfig || typeof authConfig !== 'string') {
    throw new Error('Auth config must be a string (hex encoded)');
  }
  
  // Return the auth config as bytes (will be encoded by ethers)
  return authConfig;
}

/**
 * Create wallet from mnemonic (for testing/verification)
 * 
 * @param {String} mnemonic - BIP39 mnemonic phrase
 * @param {String} [path="m/44'/60'/0'/0/0"] - HD wallet derivation path
 * @returns {Object} Wallet with address and private key
 */
function createWalletFromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0") {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey
  };
}

module.exports = {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  encodeAuthConfig,
  createWalletFromMnemonic
};

