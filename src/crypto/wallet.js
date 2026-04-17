/**
 * Wallet Crypto Utilities
 * 
 * Handles mnemonic generation, seed derivation, and auth config encoding
 * 
 * @typedef {import('../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../types/index.js').Bytes} Bytes
 * @typedef {import('../types/index.js').Bytes32} Bytes32
 * @typedef {import('../types/index.js').Address} Address
 * @typedef {import('../types/index.js').EthersWallet} EthersWallet
 * @typedef {import('../types/index.js').EthersHDNodeWallet} EthersHDNodeWallet
 * @typedef {import('../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
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
 * @returns {Buffer} Derived seed (64 bytes)
 */
function deriveSeed(mnemonic, password = '') {
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
 * Creates a wallet signature auth config from whitelist
 * @param {Address[]} whitelist - Array of whitelisted addresses
 * @returns {Bytes} ABI-encoded {@code address[]} auth config (hex)
 */
function createWalletSigAuthConfig(whitelist) {
  if (!Array.isArray(whitelist)) {
    throw new ValidationError('Whitelist must be an array', 'whitelist', whitelist);
  }
  if (whitelist.length === 0) {
    throw new ValidationError('Whitelist must contain at least one address', 'whitelist', whitelist);
  }
  for (const address of whitelist) {
    requireAddress(address, 'address');
  }
  return ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
}

/**
 * Create dual factor auth config
 * @param {Bytes32} passwordHash - Password hash
 * @param {Address} guardianAddr - Guardian address
 * @returns {Bytes} ABI-encoded {@code (bytes32,address)} auth config (hex)
 */
function createDualFactorAuthConfig(passwordHash, guardianAddr) {
  if (!passwordHash || typeof passwordHash !== 'string' || !ethers.isHexString(passwordHash, 32)) {
    throw new ValidationError('passwordHash must be a 32-byte hex string (0x-prefixed bytes32)', 'passwordHash', passwordHash);
  }
  requireAddress(guardianAddr, 'guardianAddr');

  return ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "address"], [passwordHash, guardianAddr]);
}

/**
 * Create auth proof (EIP-712 authentication proof)
 *
 * @param {CreateAuthProofWalletSignatureOptions} options
 * @returns {Promise<Bytes>} ABI-encoded {@code (uint256 deadline, bytes signature)} (hex)
 */
async function createAuthProofWalletSignature(options = {}) {
  const { signer, chainId, authenticatorAddr, deadline, keyVaultAddr } = options;

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
  log.debug('createAuthProofWalletSignature', { keyVaultAddr, authenticatorAddr, chainId, deadline });

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
        function: 'createAuthProofWalletSignature',
        originalError: errorMessage,
        originalCode: errorCode
      }
    );
  }
}

/**
 * Floor unix timestamp (seconds) to the start of its minute bucket.
 *
 * @param {number} timestampSeconds
 * @returns {number}
 */
function floorTimestampToMinuteBucket(timestampSeconds) {
  return Math.floor(Number(timestampSeconds) / 60) * 60;
}

/**
 * Build {@code authProof} for PasswordMinuteSignatureAuthenticator: {@code abi.encode(bytes signature)}
 * over the EIP-191 digest of the same {@code payloadHash} the contract uses.
 *
 * Uses {@code new Wallet(keccak256(abi.encodePacked(passwordHash, minuteBucket)))} to sign — the same
 * approach as common Hardhat scripts. The deployed Sapphire contract derives the signing key via
 * {@code Sapphire.generateSigningKeyPair}; if your on-chain verify fails, those derivations may differ.
 *
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options
 * @returns {Promise<{ authProof: Bytes, minuteBucket: number, derivedAddress: Address }>}
 */
async function createAuthProofMinuteSignature(options = {}) {
  const { provider, keyVaultAddr, authenticatorAddr, chainId, passwordHash } = options;

  if (!provider || typeof provider.getBlock !== 'function') {
    throw new ValidationError('provider must expose getBlock', 'provider', provider);
  }
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  if (typeof chainId !== 'string' && typeof chainId !== 'number') {
    throw new ValidationError('chainId must be a string or number', 'chainId', chainId);
  }
  if (!passwordHash || typeof passwordHash !== 'string' || !ethers.isHexString(passwordHash, 32)) {
    throw new ValidationError(
      'passwordHash must be a 32-byte hex string (0x-prefixed bytes32)',
      'passwordHash',
      passwordHash
    );
  }

  const block = await provider.getBlock('latest');
  if (!block) {
    throw new NetworkError('Failed to read latest block from provider', null, null);
  }
  const minuteBucket = floorTimestampToMinuteBucket(block.timestamp);

  const minuteSeed = ethers.keccak256(
    ethers.solidityPacked(['bytes32', 'uint256'], [passwordHash, BigInt(minuteBucket)])
  );

  const derivedSigner = new Wallet(minuteSeed);

  const payloadHash = ethers.keccak256(
    ethers.solidityPacked(
      ['address', 'address', 'uint256', 'uint256'],
      [keyVaultAddr, authenticatorAddr, BigInt(chainId), BigInt(minuteBucket)]
    )
  );

  const signature = await derivedSigner.signMessage(ethers.getBytes(payloadHash));
  const authProof = ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [signature]);

  log.debug('createAuthProofMinuteSignature', {
    minuteBucket,
    derivedAddress: derivedSigner.address
  });

  return {
    authProof,
    minuteBucket,
    derivedAddress: derivedSigner.address
  };
}

/**
 * Build {@code authProof} for DualFactorAuthenticator:
 * {@code abi.encode(bytes minutePasswordSignature, uint256 deadline, bytes guardianSignature)}.
 *
 * Reuses {@link createAuthProofMinuteSignature} for the minute leg (pass {@code authenticatorAddr} as the
 * DualFactor contract so {@code address(this)} in the digest matches verify). Decodes the inner 65-byte
 * signature, then the guardian {@code signer} signs EIP-712 {@code DualFactorAuth(wallet, deadline)} for the
 * same contract domain as on-chain {@code EIP712("DualFactorAuthenticator", "1")}.
 *
 * @param {CreateAuthProofDualFactorWithProviderOptions} options
 * @returns {Promise<Bytes>} ABI-encoded auth proof (hex)
 */
async function createAuthProofDualFactor(options = {}) {
  const { provider, keyVaultAddr, passwordHash, signer, authenticatorAddr, deadline, chainId } = options;

  if (!signer || !(signer instanceof Wallet || signer instanceof HDNodeWallet)) {
    throw new ValidationError(
      'Signer must be a Wallet or HDNodeWallet (guardian key)',
      'signer',
      signer
    );
  }
  if (typeof deadline !== 'number' || !Number.isInteger(deadline)) {
    throw new ValidationError('Deadline must be an integer (Unix timestamp in seconds)', 'deadline', deadline);
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (deadline < nowInSeconds) {
    throw new ValidationError('Deadline must be in the future', 'deadline', deadline);
  }

  log.info('Creating dual-factor auth proof');
  log.debug('createAuthProofDualFactor', { keyVaultAddr, authenticatorAddr, chainId, deadline });

  const minuteProof = await createAuthProofMinuteSignature({
    provider,
    keyVaultAddr,
    authenticatorAddr,
    chainId,
    passwordHash
  });

  const [minutePasswordSignature] = ethers.AbiCoder.defaultAbiCoder().decode(
    ['bytes'],
    minuteProof.authProof
  );

  const domain = {
    name: 'DualFactorAuthenticator',
    version: '1',
    chainId,
    verifyingContract: authenticatorAddr
  };
  const types = {
    DualFactorAuth: [
      { name: 'wallet', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ]
  };
  const value = { wallet: keyVaultAddr, deadline };

  try {
    const guardianSignature = await signer.signTypedData(domain, types, value);

    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'uint256', 'bytes'],
      [minutePasswordSignature, deadline, guardianSignature]
    );
  } catch (error) {
    if (error instanceof WalletError) {
      throw error;
    }

    const errorCode = error.code || error.error?.code;
    const errorMessage = error.message || String(error);

    if (
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'TIMEOUT' ||
      errorCode === 'SERVER_ERROR' ||
      errorCode === 'UNKNOWN_ERROR' ||
      error.name === 'NetworkError' ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')
    ) {
      throw new NetworkError(
        `Failed to create dual-factor auth proof: Network error during signing - ${errorMessage}`,
        null,
        error
      );
    }

    if (errorMessage.includes('encode') || errorMessage.includes('ABI')) {
      throw new ValidationError(
        `Failed to encode dual-factor auth proof: ${errorMessage}`,
        'authProof',
        { deadline }
      );
    }

    throw new WalletError(
      `Failed to create dual-factor auth proof: ${errorMessage}`,
      'UNKNOWN_ERROR',
      {
        function: 'createAuthProofDualFactor',
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
  createAuthProofWalletSignature,
  floorTimestampToMinuteBucket,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createWalletSigAuthConfig,
  createDualFactorAuthConfig
};
