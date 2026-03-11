/**
 * Wallet Crypto Utilities
 * 
 * Handles mnemonic generation, seed derivation, and auth config encoding
 * 
 * @typedef {import('../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../types/index.js').Bytes} Bytes
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').EthersWallet} EthersWallet
 * @typedef {import('../types/index.js').EthersHDNodeWallet} EthersHDNodeWallet
 */

import crypto from 'crypto';
import { ethers, HDNodeWallet, Wallet } from 'ethers';
import { requireAddress } from '../internal/assert.js';
import { NetworkError, ValidationError, WalletError } from '../errors/index.js';
import log from '../internal/logger.js';

/**
 * Generate a new mnemonic phrase (12 words)
 * 
 * @returns {Mnemonic} BIP39 mnemonic phrase
 */
function generateMnemonic() {
  // Use ethers to generate mnemonic (BIP39 compliant)
  // ethers v6: Create random wallet and extract mnemonic
  const wallet = ethers.Wallet.createRandom();
  log.debug('generateMnemonic', { phraseLength: wallet.mnemonic.phrase.length });

  return wallet.mnemonic.phrase;
}

/**
 * Derive seed from mnemonic using PBKDF2
 * 
 * @param {Mnemonic} mnemonic - BIP39 mnemonic phrase
 * @param {string} [password=''] - Optional password for seed derivation
 * @param {number} [iterations=2048] - PBKDF2 iterations
 * @returns {Buffer} Derived seed (64 bytes)
 */
function deriveSeed(mnemonic, password = '', iterations = 2048) {
  // Normalize mnemonic (remove extra whitespace)
  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  log.debug('deriveSeed', { phraseLength: normalizedMnemonic.length });

  // Use PBKDF2 to derive seed (same as Hardhat script)
  const seed = crypto.pbkdf2Sync(
    normalizedMnemonic,
    `mnemonic${password}`, // Salt format: "mnemonic" + password
    2048, // iterations
    64,   // key length (512 bits = 64 bytes)
    'sha512'
  );
  log.debug('deriveSeed', { seedLength: seed.length });

  return seed;
}

/**
 * Hash password using keccak256
 * 
 * @param {string} password - Password to hash
 * @returns {Bytes} Keccak256 hash as hex string (0x prefixed)
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
 * @param {EthersWallet | EthersHDNodeWallet} signer - Signer (Wallet or HDNodeWallet); account trying to prove it is allowed to access 
 * @param {string | number} chainId - Chain ID
 * @param {Address} authenticatorAddr - Wallet signature authenticator contract address
 * @param {number} deadline - Deadline for the auth proof (Unix timestamp in seconds)
 * @param {Address} keyVaultAddr - Key vault address
 * @returns {Promise<Bytes>} Auth proof (bytes)
 */
async function createAuthProof(signer, chainId, authenticatorAddr, deadline, keyVaultAddr) {
  
  // Validate signer
  if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
    throw new ValidationError('Signer must be a Wallet or HDNodeWallet', 'signer', signer);
  }

  // Validate chainId (can be string or number)
  if (typeof chainId !== 'string' && typeof chainId !== 'number') {
    throw new ValidationError('chainId must be a string or number', 'chainId', chainId);
  }

  // Validate addresses
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');

  // Validate deadline (must be number, Unix timestamp in seconds) and in the future
  if (typeof deadline !== 'number' || !Number.isInteger(deadline)) {
    throw new ValidationError('Deadline must be an integer (Unix timestamp in seconds)', 'deadline', deadline);
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (deadline < nowInSeconds) {
    throw new ValidationError('Deadline must be in the future', 'deadline', deadline);
  }

  log.info('Creating auth proof');
  log.debug('createAuthProof', { keyVaultAddr, authenticatorAddr, chainId, deadline });

  // build EIP-712 domain
  const domain = {
    name: "WalletSignatureAuthenticator",
    version: "1",
    chainId: chainId, 
    verifyingContract: authenticatorAddr 
  };
  const types = {
    WalletAuth: [
      { name: "wallet", type: "address" },
      { name: "deadline", type: "uint256" }
    ]
  };

  // Note: For KeyVault auth, the "wallet" in the signature is the KeyVault address
  const value = { wallet: keyVaultAddr, deadline };
  
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
    
    // Extract error details
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

    // Encoding errors (should be rare)
    if (errorMessage.includes('encode') || errorMessage.includes('ABI')) {
      throw new ValidationError(
        `Failed to encode auth proof: ${errorMessage}`,
        'authProof',
        { deadline }
      );
    }
    
    // Generic error fallback - use standard UNKNOWN_ERROR code
    throw new WalletError(
      `Failed to create auth proof: ${errorMessage}`,
      'UNKNOWN_ERROR',
      {
        function: 'createAuthProof',
        originalError: errorMessage,
        originalCode: errorCode
      }
    );
  }
}

export {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  createAuthProof
};
