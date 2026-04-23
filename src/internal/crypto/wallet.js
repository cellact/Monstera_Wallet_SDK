/**
 * Internal wallet crypto utilities (mnemonic, seed, auth config encoding, auth proof builders).
 * Not part of the public package API; import only from other `src/` modules.
 *
 * @typedef {import('../../types/index.js').Mnemonic} Mnemonic
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').EthersWallet} EthersWallet
 * @typedef {import('../../types/index.js').EthersHDNodeWallet} EthersHDNodeWallet
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 * @typedef {import('../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
 * @typedef {import('../../types/index.js').DualFactorAuthConfigInputOptions} DualFactorAuthConfigInputOptions
 * @typedef {import('../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 * @typedef {import('../../types/index.js').EncodedAuthConfigDualFactor} EncodedAuthConfigDualFactor
 * @typedef {import('../../types/index.js').EncodedAuthProofWalletSignature} EncodedAuthProofWalletSignature
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureResult} CreateAuthProofMinuteSignatureResult
 * @typedef {import('../../types/index.js').EncodedAuthProofDualFactor} EncodedAuthProofDualFactor
 * @typedef {import('../../types/index.js').CreateImplCallOptions} CreateImplCallOptions
 * @typedef {import('../../types/index.js').AuthorizationSplitSignature} AuthorizationSplitSignature
 * @typedef {import('../../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 */

import crypto from 'crypto';
import { ethers, Wallet } from 'ethers';
import {
  requireAddress,
  requireString,
  requireMnemonic,
  requireArray,
  requireBytes32,
  requireWalletOrHdNode,
  requireStringOrNumber,
  requirePositiveInteger,
  requireNonNegativeInteger,
  requireBytes,
  isInFuture
} from '../assert.js';
import { floorTimestampToMinuteBucket } from '../utils/time.js';
import { NetworkError, ValidationError, WalletError } from '../../errors/index.js';
import log from '../logger.js';

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
 * @throws {ValidationError} If mnemonic is not a valid BIP39 mnemonic
 */
function deriveSeed(mnemonic, password = '') {
  requireMnemonic(mnemonic, 'mnemonic');
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
 * @throws {ValidationError} If password is not a string or is empty
 */
function hashPassword(password) {
  requireString(password, 'password');
  // Use ethers to hash with keccak256
  return ethers.keccak256(ethers.toUtf8Bytes(password));
}

/**
 * Creates a wallet signature auth config from whitelist
 * @param {WalletSignatureAuthConfigInputOptions}
 * @returns {EncodedAuthConfigWalletSignature} ABI-encoded {@code address[]} auth config (hex)
 * @throws {ValidationError} If whitelist is not an array or contains invalid addresses
 */
function createWalletSigAuthConfig(whitelist) {
  requireArray(whitelist, 'whitelist');
  for (const address of whitelist) {
    requireAddress(address, 'address');
  }
  return ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [whitelist]);
}

/**
 * Create dual factor auth config
 * @param {DualFactorAuthConfigInputOptions}
 * @returns {EncodedAuthConfigDualFactor} ABI-encoded {@code (bytes32,address)} auth config (hex)
 * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string or guardianAddr is not a valid address or signer is not a Wallet or HDNodeWallet
 */
function createDualFactorAuthConfig(passwordHash, guardianAddr) {
  requireBytes32(passwordHash, 'passwordHash');
  requireAddress(guardianAddr, 'guardianAddr');

  return ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "address"], [passwordHash, guardianAddr]);
}

/**
 * Create auth proof (EIP-712 authentication proof)
 *
 * @param {CreateAuthProofWalletSignatureOptions} options
 * @returns {Promise<EncodedAuthProofWalletSignature>} encoded auth proof 
 * @throws {ValidationError} If signer is not a Wallet or HDNodeWallet, chainId is not a string or number, authenticatorAddr is not a valid address, keyVaultAddr is not a valid address, deadline is not a number or is not an integer (Unix timestamp in seconds), or deadline is in the past
 */
async function createAuthProofWalletSignature(options = {}) {
  const { signer, chainId, authenticatorAddr, deadline, keyVaultAddr } = options;

  // Validate signer
  requireWalletOrHdNode(signer, 'signer');

  // Validate chainId (can be string or number)
  requireStringOrNumber(chainId, 'chainId');

  // Validate addresses
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireAddress(keyVaultAddr, 'keyVaultAddr');

  // Validate deadline (must be number, Unix timestamp in seconds) and in the future
  requirePositiveInteger(deadline, 'deadline');

  isInFuture(deadline, 'deadline');

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
 * Build {@code authProof} for PasswordMinuteSignatureAuthenticator: {@code abi.encode(bytes signature)}
 * over the EIP-191 digest of the same {@code payloadHash} the contract uses.
 *
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>} encoded auth proof 
 * @throws {ValidationError} If provider is not a valid provider, keyVaultAddr is not a valid address, authenticatorAddr is not a valid address, chainId is not a string or number, or passwordHash is not a valid 32-byte hex string
 */
async function createAuthProofMinuteSignature(options = {}) {
  const { provider, keyVaultAddr, authenticatorAddr, chainId, passwordHash } = options;

  if (!provider || typeof provider.getBlock !== 'function') {
    throw new ValidationError('provider must expose getBlock', 'provider', provider);
  }
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(authenticatorAddr, 'authenticatorAddr');
  requireStringOrNumber(chainId, 'chainId');
  requireBytes32(passwordHash, 'passwordHash');

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
 * @returns {Promise<EncodedAuthProofDualFactor>} encoded auth proof 
 * @throws {ValidationError} If provider is not a valid provider, keyVaultAddr is not a valid address, passwordHash is not a valid 32-byte hex string, signer is not a Wallet or HDNodeWallet, authenticatorAddr is not a valid address, chainId is not a string or number, deadline is not a number or is not an integer (Unix timestamp in seconds), or deadline is in the past
 */
async function createAuthProofDualFactor(options = {}) {
  const { provider, keyVaultAddr, passwordHash, signer, authenticatorAddr, deadline, chainId } = options;

  requireBytes32(passwordHash, 'passwordHash');
  requireWalletOrHdNode(signer, 'signer');
  requirePositiveInteger(deadline, 'deadline');

  isInFuture(deadline, 'deadline');

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

/** @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7702.md — authorization digest uses the same preimage as ethers `hashAuthorization`. */
const SIGN_AUTHORIZATION_IMPL_ABI = [
  'function signAuthorizationImpl(bytes32 baseKey, bytes32 baseChain, uint32 index, address delegate, uint64 authNonce, uint256 chainId) view returns (bytes32 r, bytes32 s, uint8 yParity)'
];

const signAuthorizationImplInterface = new ethers.Interface(SIGN_AUTHORIZATION_IMPL_ABI);

const UINT64_MAX = (1n << 64n) - 1n;
const UINT32_MAX = (1n << 32n) - 1n;

/**
 * EIP-7702 authorization tuple for hashing / verification (ethers-compatible field names).
 *
 * @typedef {{ chainId: bigint, address: Address, nonce: bigint }} AuthorizationTupleInput
 */

/**
 * Normalize caller input into an ethers authorization tuple ({@code chainId}, checksummed {@code address}, {@code nonce}).
 *
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number|bigint, nonce: number|bigint }} auth
 * @returns {AuthorizationTupleInput}
 */
function normalizeAuthorizationTuple(auth) {
  if (!auth || typeof auth !== 'object') {
    throw new ValidationError('auth is required', 'auth', auth);
  }
  const rawAddr = auth.address ?? auth.delegateAddr;
  requireAddress(rawAddr, 'address');
  const address = ethers.getAddress(rawAddr);
  const chainId = BigInt(auth.chainId);
  const nonce = BigInt(auth.nonce);
  return { chainId, address, nonce };
}

/**
 * EIP-7702 authorization digest: {@code keccak256(0x05 || rlp([chainId, address, nonce]))}.
 * Delegates to ethers v6 {@link ethers.hashAuthorization} for byte-for-byte compatibility.
 *
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number|bigint, nonce: number|bigint }} auth
 * @returns {Bytes32}
 */
function hashAuthorization(auth) {
  return ethers.hashAuthorization(normalizeAuthorizationTuple(auth));
}

/**
 * Recover the signer address for an authorization tuple and split signature ({@code r}, {@code s}, {@code yParity}).
 *
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number|bigint, nonce: number|bigint }} auth
 * @param {AuthorizationSplitSignature} signature
 * @returns {Address}
 */
function verifyAuthorization(auth, signature) {
  return ethers.verifyAuthorization(normalizeAuthorizationTuple(auth), signature);
}

/**
 * Read {@code chainId} from an ethers provider's current network (EIP-155).
 *
 * @param {import('../../types/index.js').EthersAbstractProvider} provider
 * @returns {Promise<bigint>}
 */
async function fetchAuthorizationChainId(provider) {
  if (!provider || typeof provider.getNetwork !== 'function') {
    throw new ValidationError('provider must expose getNetwork()', 'provider', provider);
  }
  const net = await provider.getNetwork();
  return BigInt(net.chainId);
}

/**
 * EIP-7702 authorization {@code nonce} for an authority address: latest transaction count on the target chain.
 *
 * @param {import('../../types/index.js').EthersAbstractProvider} provider
 * @param {Address} authorityAddress - Account address for {@code index} (the EOA / smart-wallet authority on the target chain)
 * @returns {Promise<bigint>}
 */
async function fetchAuthorizationNonce(provider, authorityAddress) {
  if (!provider || typeof provider.getTransactionCount !== 'function') {
    throw new ValidationError('provider must expose getTransactionCount()', 'provider', provider);
  }
  requireAddress(authorityAddress, 'authorityAddress');
  const count = await provider.getTransactionCount(authorityAddress);
  return BigInt(count);
}

/**
 * Encode {@code signAuthorizationImpl} calldata for {@link KeyVaultClient.prototype.executeWithAuth}.
 * Uses placeholder zero bytes32 base key/chain slots; KeyVault substitutes real derivation material.
 *
 * @param {CreateImplCallOptions} options
 * @returns {Bytes} ABI-encoded call data (hex)
 * @throws {ValidationError} If required parameters are missing or invalid
 */
function createImplCall(options = {}) {
  const { index, delegateAddr, nonce, chainId } = options;
  requireNonNegativeInteger(index, 'index');
  requireAddress(delegateAddr, 'delegateAddr');

  const idx = BigInt(index);
  if (idx > UINT32_MAX) {
    throw new ValidationError('index must fit uint32', 'index', index);
  }

  const nonceBn = BigInt(nonce);
  if (nonceBn < 0n || nonceBn > UINT64_MAX) {
    throw new ValidationError('nonce must fit uint64', 'nonce', nonce);
  }

  const chainBn = BigInt(chainId);
  if (chainBn < 0n) {
    throw new ValidationError('chainId must be non-negative', 'chainId', chainId);
  }

  return signAuthorizationImplInterface.encodeFunctionData('signAuthorizationImpl', [
    ethers.ZeroHash,
    ethers.ZeroHash,
    Number(idx),
    delegateAddr,
    nonceBn,
    chainBn
  ]);
}

/**
 * EIP-55 checksummed address (same as ethers {@link ethers.getAddress}).
 *
 * @param {Address} address
 * @returns {Address}
 */
function toChecksumAddress(address) {
  requireAddress(address, 'address');
  return ethers.getAddress(address);
}

/**
 * Decode KeyVault {@code executeWithAuth} return data from {@code signAuthorizationImpl}: {@code (bytes32 r, bytes32 s, uint8 yParity)} ABI-encoded as bytes.
 *
 * @param {Bytes} returnData
 * @returns {AuthorizationSplitSignature}
 */
function decodeSignAuthorizationResult(returnData) {
  requireBytes(returnData, 'returnData');
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['bytes32', 'bytes32', 'uint8'], returnData);
  const yParityNum = Number(decoded[2]);
  if (yParityNum !== 0 && yParityNum !== 1) {
    throw new ValidationError('invalid yParity from KeyVault', 'signature.yParity', decoded[2]);
  }
  return {
    r: decoded[0],
    s: decoded[1],
    yParity: /** @type {0|1} */ (yParityNum)
  };
}

/**
 * Assemble {@link SignedAuthorizationResult} from resolved fields and raw {@code executeWithAuth} output.
 *
 * @param {{ delegateAddr: Address, nonce: bigint, chainId: bigint, raw: Bytes }} params
 * @returns {SignedAuthorizationResult}
 */
function finalizeSignedAuthorizationResult(params) {
  const { delegateAddr, nonce, chainId, raw } = params;
  requireAddress(delegateAddr, 'delegateAddr');
  return {
    address: delegateAddr,
    nonce,
    chainId,
    signature: decodeSignAuthorizationResult(raw)
  };
}

export {
  generateMnemonic,
  deriveSeed,
  hashPassword,
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createWalletSigAuthConfig,
  createDualFactorAuthConfig,
  normalizeAuthorizationTuple,
  hashAuthorization,
  verifyAuthorization,
  fetchAuthorizationChainId,
  fetchAuthorizationNonce,
  createImplCall,
  toChecksumAddress,
  decodeSignAuthorizationResult,
  finalizeSignedAuthorizationResult
};
