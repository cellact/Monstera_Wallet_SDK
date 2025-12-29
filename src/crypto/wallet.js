/**
 * Wallet Crypto Utilities
 * 
 * Handles mnemonic generation, seed derivation, and auth config encoding
 */

const crypto = require('crypto');
const { ethers, Wallet, HDNodeWallet } = require('ethers');
const { requireAddress } = require('../internal/assert');
const { ValidationError, NetworkError, WalletError } = require('../errors');

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
    throw new ValidationError('Password must be a non-empty string', 'password', password);
  }
  
  // Use ethers to hash with keccak256
  return ethers.keccak256(ethers.toUtf8Bytes(password));
}

/**
 * Create auth proof (EIP-712 authentication proof)
 * 
 * @param {Object} signer - Signer (Wallet or HDNodeWallet); account trying to prove it is allowed to access 
 * @param {String} chainId - Chain ID
 * @param {String} authenticator - Wallet signature authenticator contract address
 * @param {Number} deadline - Deadline for the auth proof
 * @param {String} keyVaultAddress - Key vault address
 * @returns {String} Auth proof (bytes)
 */
async function createAuthProof(signer, chainId, authenticator, deadline, keyVaultAddress) {
  
  // Validate signer
  if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
    throw new ValidationError('Signer must be a Wallet or HDNodeWallet', 'signer', signer);
  }

  // Validate chainId (can be string or number)
  if (typeof chainId !== 'string' && typeof chainId !== 'number') {
    throw new ValidationError('chainId must be a string or number', 'chainId', chainId);
  }

  // Validate addresses
  requireAddress(authenticator, 'authenticator');
  requireAddress(keyVaultAddress, 'keyVaultAddress');

  // Validate deadline (must be number, Unix timestamp in seconds) and in the future
  if (typeof deadline !== 'number' || !Number.isInteger(deadline)) {
    throw new ValidationError('Deadline must be an integer (Unix timestamp in seconds)', 'deadline', deadline);
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (deadline < nowInSeconds) {
    throw new ValidationError('Deadline must be in the future', 'deadline', deadline);
  }
  
  // build EIP-712 domain
  const domain = {
    name: "WalletSignatureAuthenticator",
    version: "1",
    chainId: chainId, 
    verifyingContract: authenticator 
  };
  const types = {
    WalletAuth: [
      { name: "wallet", type: "address" },
      { name: "deadline", type: "uint256" }
    ]
  };

  // Note: For KeyVault auth, the "wallet" in the signature is the KeyVault address
  const value = { wallet: keyVaultAddress, deadline };
  
  try {
    // Sign the typed data (EIP-712)
    const signature = await signer.signTypedData(domain, types, value);
    
    // Encode the auth proof (deadline + signature)
    return ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "bytes"], [deadline, signature]);
  } catch (error) {
    // Re-throw WalletError as-is (validation errors, etc.)
    if (error instanceof WalletError) {
      throw error;
    }
    
    // Translate provider/network errors
    const errorCode = error.code || error.error?.code;
    const errorMessage = error.message || String(error);
    
    // Network/RPC errors from signer provider
    if (errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT' || 
        errorCode === 'SERVER_ERROR' || errorCode === 'UNKNOWN_ERROR' ||
        error.name === 'NetworkError' || errorMessage.includes('network') ||
        errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      throw new NetworkError(
        `Failed to create auth proof: Network error during signing - ${errorMessage}`,
        null,
        error
      );
    }
    
    // Signing errors (invalid signer state, missing provider, etc.)
    if (errorMessage.includes('sign') || errorMessage.includes('signer') ||
        errorMessage.includes('private key') || errorMessage.includes('mnemonic')) {
      throw new WalletError(
        `Failed to create auth proof: Signing error - ${errorMessage}`,
        'SIGNING_FAILED',
        {
          function: 'createAuthProof',
          originalError: errorMessage,
          originalCode: errorCode
        }
      );
    }
    
    // Encoding errors (should be rare)
    if (errorMessage.includes('encode') || errorMessage.includes('ABI')) {
      throw new ValidationError(
        `Failed to encode auth proof: ${errorMessage}`,
        'authProof',
        { deadline }
      );
    }
    
    // Generic error fallback
    throw new WalletError(
      `Failed to create auth proof: ${errorMessage}`,
      'AUTH_PROOF_CREATION_FAILED',
      {
        function: 'createAuthProof',
        originalError: errorMessage,
        originalCode: errorCode
      }
    );
  }
}

module.exports = {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  createAuthProof
};

