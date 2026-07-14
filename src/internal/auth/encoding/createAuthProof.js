/**
 * Off-chain {@code authProof} byte builders for the built-in KeyVault authenticators.
 *
 * Three flavours:
 * - {@link createAuthProofWalletSignature} — single EIP-712 wallet signature
 * - {@link createAuthProofMinuteSignature} — ECDSA signature derived from the password hash and
 *   the latest block's minute bucket (replay-resistant for ~1 minute windows)
 * - {@link createAuthProofDualFactor} — combines both: minute-bucket password signature plus an
 *   EIP-712 guardian signature
 *
 * Input validation lives in {@link ../validators/authProofOptions.js} so rules stay in one place.
 * Signing failures are funnelled through {@link sdkErrorPipeline} with {@code authProofType} set,
 * so the {@code signingTranslator} categorises them.
 *
 *
 * @module internal/auth/encoding/createAuthProof
 */

import { Wallet } from '../../../adapters/ethers/index.js';
import { defaultAbiCoder } from '../../../adapters/ethers/encoding.js';
import { getBytes, keccak256, solidityPacked } from '../../../adapters/ethers/hashing.js';
import {
  requireUtf8Bytes,
  requireBytes32,
  requireAddress,
  requireNonEmptyBytes,
  requireWalletOrHdNode,
  requireNumber,
} from '../../assert.js';
import {
  assertWalletSignatureAuthProofOptions,
  assertMinuteSignatureAuthProofOptions,
  assertDualFactorAuthProofOptions
} from '../../validators/authProofOptions.js';
import { floorTimestampToMinuteBucket } from '../../utils/time.js';
import { NetworkError } from '../../../errors/index.js';
import log from '../../logger.js';
import { sdkErrorPipeline } from '../../../errors/pipeline.js';

/** Shared EIP-712 field layout for action-bound authenticator proofs. */
const ACTION_AUTH_EIP712_FIELDS = [
  { name: 'wallet', type: 'address' },
  { name: 'actionHash', type: 'bytes32' },
  { name: 'deadline', type: 'uint256' }
];

/**
 * Sign an EIP-712 action-bound authenticator proof and return encoded output bytes.
 *
 * @private
 * @async
 * @param {Object} params
 * @param {EthersWallet | EthersHDNodeWallet} params.signer
 * @param {string} params.contractName - EIP-712 domain {@code name}
 * @param {string} params.structName - Primary typed-data struct name
 * @param {ChainId} params.chainId
 * @param {Address} params.verifyingContract
 * @param {Address} params.keyVaultAddr
 * @param {Bytes32} params.actionHash
 * @param {number | bigint} params.deadline
 * @param {string} params.authProofType - Error pipeline label
 * @param {string} params.functionName - Error pipeline label
 * @param {(signature: string) => Bytes} params.encodeOutput
 * @returns {Promise<Bytes>}
 */
async function signEip712ActionProof({
  signer,
  contractName,
  structName,
  chainId,
  verifyingContract,
  keyVaultAddr,
  actionHash,
  deadline,
  authProofType,
  functionName,
  encodeOutput
}) {
  const domain = {
    name: contractName,
    version: '1',
    chainId,
    verifyingContract
  };
  const types = {
    [structName]: ACTION_AUTH_EIP712_FIELDS
  };
  const value = { wallet: keyVaultAddr, actionHash, deadline };

  try {
    const signature = await signer.signTypedData(domain, types, value);
    return encodeOutput(signature);
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType,
      functionName,
      validationExtra: { deadline }
    });
  }
}

/**
 * Encode the minute-bucket signature payload after the input has already been validated.
 *
 * @description Reads the latest block to compute the current minute bucket, derives an ephemeral
 * signer from {@code keccak256(passwordHash || minuteBucket)}, signs the contract's payload hash
 * via EIP-191, and ABI-encodes the resulting signature. The derived address is returned for
 * diagnostic / dual-factor reuse.
 *
 * @private
 * @async
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} options - Already-validated options
 * @param {ChainId} normalizedChainId - Normalised chain id (numeric / bigint per project type)
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>} The encoded auth proof and metadata
 *   ({@code minuteBucket}, {@code derivedAddress})
 * @throws {NetworkError} If {@code provider.getBlock('latest')} returns falsy (e.g. the RPC is
 *   not synced)
 * @throws {WalletError} Any underlying signer error is left to bubble up to the caller, which
 *   funnels it through {@link sdkErrorPipeline}
 */
async function encodeMinuteSignatureProofPayload(options, normalizedChainId, actionHash) {
  const { provider, keyVaultAddr, authenticatorAddr, passwordHash } = options;

  const block = await provider.getBlock('latest');
  if (!block) {
    throw new NetworkError('Failed to read latest block from provider', null, null);
  }
  const minuteBucket = floorTimestampToMinuteBucket(block.timestamp);

  const minuteSeed = keccak256(
    solidityPacked(['bytes32', 'uint256'], [passwordHash, BigInt(minuteBucket)])
  );

  const derivedSigner = new Wallet(minuteSeed);

  const payloadHash = keccak256(
    solidityPacked(
      ['address', 'address', 'uint256', 'uint256', 'bytes32'],
      [keyVaultAddr, authenticatorAddr, BigInt(normalizedChainId), BigInt(minuteBucket), actionHash]
    )
  );

  const signature = await derivedSigner.signMessage(getBytes(payloadHash));
  const authProof = defaultAbiCoder.encode(['bytes'], [signature]);

  log.debug('encodeMinuteSignatureProofPayload', { minuteBucket });

  return {
    authProof,
    minuteBucket,
    derivedAddress: derivedSigner.address
  };
}

/**
 * Build {@code authProof} bytes for the {@code WalletSignatureAuthenticator}.
 *
 * @description Validates the input via {@link assertWalletSignatureAuthProofOptions}, builds the
 * EIP-712 domain / types / value, signs them, and returns
 * {@code abi.encode(uint256 deadline, bytes signature)}.
 *
 * @public
 * @async
 * @param {CreateAuthProofWalletSignatureOptions} [options={}] - Wallet signer, key vault address,
 *   authenticator address, deadline, optional chain id
 * @returns {Promise<EncodedAuthProofWalletSignature>} ABI-encoded {@code (deadline, signature)} bytes
 * @throws {ValidationError} If {@code signer} is not a {@code Wallet}/{@code HDNodeWallet},
 *   {@code chainId} is invalid, {@code authenticatorAddr} or {@code keyVaultAddr} fail address
 *   validation, or {@code deadline} is missing / not an integer / in the past (raised by
 *   {@link assertWalletSignatureAuthProofOptions})
 * @throws {NetworkError} If the underlying signer reports a transport error
 * @throws {WalletError} Any other signer-side error translated by the {@code signingTranslator}
 *   (e.g. ABI encoding failure, generic signer rejection)
 */
async function createAuthProofWalletSignature(options = {}) {
  const { signer, authenticatorAddr, deadline, keyVaultAddr, actionHash, eip712ContractName } = options;
  const { normalizedChainId } = assertWalletSignatureAuthProofOptions(options);

  log.info('Creating wallet signature auth proof');
  log.debug('createAuthProofWalletSignature', {
    keyVaultAddr,
    authenticatorAddr,
    chainId: normalizedChainId,
    deadline,
    actionHash
  });

  return signEip712ActionProof({
    signer,
    contractName: eip712ContractName ?? 'WalletSignatureAuthenticator',
    structName: 'WalletAuth',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr,
    keyVaultAddr,
    actionHash,
    deadline,
    authProofType: 'wallet-signature auth proof',
    functionName: 'createAuthProofWalletSignature',
    encodeOutput: (signature) => defaultAbiCoder.encode(['uint256', 'bytes'], [deadline, signature])
  });
}

/**
 * Build {@code authProof} bytes for the {@code PasswordMinuteSignatureAuthenticator}.
 *
 * @description Validates the input via {@link assertMinuteSignatureAuthProofOptions} and defers to
 * {@link encodeMinuteSignatureProofPayload}. The proof is {@code abi.encode(bytes signature)} over
 * the EIP-191 digest of the same {@code payloadHash} the contract recomputes on-chain.
 *
 * @public
 * @async
 * @param {CreateAuthProofMinuteSignatureWithProviderOptions} [options={}] - Read provider, key
 *   vault and authenticator addresses, chain id, password hash
 * @returns {Promise<CreateAuthProofMinuteSignatureResult>} Encoded auth proof bundle
 * @throws {ValidationError} If {@code provider} is missing, addresses fail validation,
 *   {@code chainId} is invalid, {@code passwordHash} is not a 32-byte hex string, or
 *   {@code actionHash} is missing (raised by {@link assertMinuteSignatureAuthProofOptions})
 * @throws {NetworkError} If the latest block cannot be fetched (forwarded from
 *   {@link encodeMinuteSignatureProofPayload})
 */
async function createAuthProofMinuteSignature(options = {}) {
  const { normalizedChainId } = assertMinuteSignatureAuthProofOptions(options);
  log.info('Creating minute signature auth proof');
  return encodeMinuteSignatureProofPayload(options, normalizedChainId, options.actionHash);
}

/**
 * Build {@code authProof} bytes for the {@code DualFactorAuthenticator}.
 *
 * @description Validates the input via {@link assertDualFactorAuthProofOptions}, computes the
 * minute-bucket password signature via {@link encodeMinuteSignatureProofPayload}, then signs the
 * EIP-712 guardian payload. Returns
 * {@code abi.encode(bytes minutePasswordSignature, uint256 deadline, bytes guardianSignature)}.
 *
 * @public
 * @async
 * @param {CreateAuthProofDualFactorWithProviderOptions} [options={}] - Read provider, key vault
 *   and authenticator addresses, password hash, guardian signer, deadline, optional chain id
 * @returns {Promise<EncodedAuthProofDualFactor>} ABI-encoded dual-factor proof bytes
 * @throws {ValidationError} If any input fails validation (raised by
 *   {@link assertDualFactorAuthProofOptions})
 * @throws {NetworkError} If the latest block cannot be fetched while building the minute-bucket
 *   signature, or if the guardian signer reports a transport error
 * @throws {WalletError} Any other signer-side error translated by the {@code signingTranslator}
 */
async function createAuthProofDualFactor(options = {}) {
  const { signer, keyVaultAddr, authenticatorAddr, deadline, actionHash } = options;

  const { normalizedChainId } = assertDualFactorAuthProofOptions(options);

  log.info('Creating dual-factor auth proof');
  log.debug('createAuthProofDualFactor', {
    keyVaultAddr,
    authenticatorAddr,
    chainId: normalizedChainId,
    deadline,
    actionHash
  });

  const minuteProof = await encodeMinuteSignatureProofPayload(
    options,
    normalizedChainId,
    actionHash
  );

  const [minutePasswordSignature] = defaultAbiCoder.decode(['bytes'], minuteProof.authProof);

  return signEip712ActionProof({
    signer,
    contractName: 'DualFactorAuthenticator',
    structName: 'DualFactorAuth',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr,
    keyVaultAddr,
    actionHash,
    deadline,
    authProofType: 'dual-factor auth proof',
    functionName: 'createAuthProofDualFactor',
    encodeOutput: (guardianSignature) =>
      defaultAbiCoder.encode(
        ['bytes', 'uint256', 'bytes'],
        [minutePasswordSignature, deadline, guardianSignature]
      )
  });
}

/**
 * Build {@code authProof} bytes for the {@code PasswordAuthenticator}.
 *
 * @description Returns {@code abi.encode(bytes password, bytes32 actionHash)}.
 *
 * @public
 * @param {Object} options
 * @param {Uint8Array} options.password - UTF-8 password bytes
 * @param {Bytes32} options.actionHash - Canonical action hash
 * @returns {EncodedAuthProofPassword} ABI-encoded password proof bytes
 */
function createAuthProofPassword({ password, actionHash }) {
  requireUtf8Bytes(password, 'password');
  requireBytes32(actionHash, 'actionHash');
  return defaultAbiCoder.encode(['bytes', 'bytes32'], [password, actionHash]);
}

/**
 * Build {@code authProof} bytes for the {@code MultiAuthenticator}.
 *
 * @description Returns {@code abi.encode(address child, bytes childProof)}.
 *
 * @public
 * @param {Object} options
 * @param {Address} options.child - Enabled child authenticator address
 * @param {Bytes} options.childProof - Child authenticator proof bytes
 * @returns {EncodedAuthProofMulti}
 */
function createAuthProofMulti({ child, childProof }) {
  requireAddress(child, 'child');
  requireNonEmptyBytes(childProof, 'childProof');
  return defaultAbiCoder.encode(['address', 'bytes'], [child, childProof]);
}

/** @type {1} */
const METHOD_PASSWORD = 1;

/** @type {2} */
const METHOD_WALLET_SIGNATURE = 2;

const LINK_WALLET_EIP712_FIELDS = [
  { name: 'wallet', type: 'address' },
  { name: 'newAddress', type: 'address' },
  { name: 'nonce', type: 'bytes32' },
  { name: 'deadline', type: 'uint256' },
  { name: 'actionHash', type: 'bytes32' },
];

/**
 * @param {'password' | 'walletSignature' | number | undefined} method
 * @returns {'password' | 'walletSignature' | undefined}
 */
function normalizePasswordOrWalletMethod(method) {
  if (method === METHOD_PASSWORD || method === 'password') {
    return 'password';
  }
  if (method === METHOD_WALLET_SIGNATURE || method === 'walletSignature') {
    return 'walletSignature';
  }
  return undefined;
}

/**
 * Build {@code authProof} bytes for {@code PasswordOrWalletSignatureAuthenticator}.
 *
 * @description Returns {@code abi.encode(uint8 method, bytes methodProof)} where method {@code 1}
 * uses {@code abi.encode(bytes password, bytes32 actionHash)} and method {@code 2} uses
 * {@code abi.encode(uint256 deadline, bytes signature)} over EIP-712 {@code WalletAuth}.
 *
 * @public
 * @async
 * @param {Object} options
 * @param {'password' | 'walletSignature' | number} [options.method] - Explicit method; inferred from signer/password when omitted
 * @param {Uint8Array} [options.password] - UTF-8 password bytes
 * @param {EthersWallet | EthersHDNodeWallet} [options.signer]
 * @param {Address} options.authenticatorAddr
 * @param {Address} options.keyVaultAddr
 * @param {Bytes32} options.actionHash
 * @param {ChainId} options.chainId
 * @param {number | bigint} [options.deadline]
 * @returns {Promise<EncodedAuthProofPasswordOrWalletSignature>}
 */
async function createAuthProofPasswordOrWalletSignature(options = {}) {
  const method = normalizePasswordOrWalletMethod(options.method)
    ?? (options.signer != null ? 'walletSignature' : 'password');

  if (method === 'password') {
    const methodProof = createAuthProofPassword({
      password: options.password,
      actionHash: options.actionHash,
    });
    return defaultAbiCoder.encode(['uint8', 'bytes'], [METHOD_PASSWORD, methodProof]);
  }

  const methodProof = await createAuthProofWalletSignature({
    ...options,
    eip712ContractName: 'PasswordOrWalletSignatureAuthenticator',
  });
  return defaultAbiCoder.encode(['uint8', 'bytes'], [METHOD_WALLET_SIGNATURE, methodProof]);
}

/**
 * Sign EIP-712 {@code LinkWallet} for {@code addToWhitelistWithProof}.
 *
 * @public
 * @async
 * @param {Object} options
 * @param {EthersWallet | EthersHDNodeWallet} options.linkSigner
 * @param {Address} options.keyVaultAddr
 * @param {Address} options.newAddress
 * @param {Bytes32} options.nonce
 * @param {number | bigint} options.deadline
 * @param {Bytes32} options.actionHash
 * @param {Address} options.authenticatorAddr
 * @param {ChainId} options.chainId
 * @returns {Promise<Bytes>}
 */
async function createLinkWalletSignature(options = {}) {
  const {
    linkSigner,
    keyVaultAddr,
    newAddress,
    nonce,
    deadline,
    actionHash,
    authenticatorAddr,
    chainId,
  } = options;

  requireWalletOrHdNode(linkSigner, 'linkSigner');
  requireAddress(keyVaultAddr, 'keyVaultAddr');
  requireAddress(newAddress, 'newAddress');
  requireBytes32(nonce, 'nonce');
  requireNumber(deadline, 'deadline', { allowBigInt: true });
  requireBytes32(actionHash, 'actionHash');
  requireAddress(authenticatorAddr, 'authenticatorAddr');

  const domain = {
    name: 'PasswordOrWalletSignatureAuthenticator',
    version: '1',
    chainId,
    verifyingContract: authenticatorAddr,
  };
  const types = { LinkWallet: LINK_WALLET_EIP712_FIELDS };
  const value = { wallet: keyVaultAddr, newAddress, nonce, deadline, actionHash };

  try {
    return await linkSigner.signTypedData(domain, types, value);
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType: 'password-or-wallet link signature',
      functionName: 'createLinkWalletSignature',
      validationExtra: { deadline },
    });
  }
}

export {
  createAuthProofWalletSignature,
  createAuthProofMinuteSignature,
  createAuthProofDualFactor,
  createAuthProofPassword,
  createAuthProofMulti,
  createAuthProofPasswordOrWalletSignature,
  createLinkWalletSignature,
};

export { createAuthProofApiKeySession } from './apiKeySessionProof.js';
