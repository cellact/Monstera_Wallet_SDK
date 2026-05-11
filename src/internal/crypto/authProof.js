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
 * @typedef {import('../../types/index.js').CreateAuthProofWalletSignatureOptions} CreateAuthProofWalletSignatureOptions
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureWithProviderOptions} CreateAuthProofMinuteSignatureWithProviderOptions
 * @typedef {import('../../types/index.js').CreateAuthProofDualFactorWithProviderOptions} CreateAuthProofDualFactorWithProviderOptions
 * @typedef {import('../../types/index.js').EncodedAuthProofWalletSignature} EncodedAuthProofWalletSignature
 * @typedef {import('../../types/index.js').CreateAuthProofMinuteSignatureResult} CreateAuthProofMinuteSignatureResult
 * @typedef {import('../../types/index.js').EncodedAuthProofDualFactor} EncodedAuthProofDualFactor
 * @typedef {import('../../types/index.js').ChainId} ChainId
 *
 * @module internal/crypto/authProof
 */

import { Wallet } from '../../adapters/ethers/index.js';
import { defaultAbiCoder } from '../../adapters/ethers/encoding.js';
import { getBytes, keccak256, solidityPacked } from '../../adapters/ethers/hashing.js';
import {
  assertWalletSignatureAuthProofOptions,
  assertMinuteSignatureAuthProofOptions,
  assertDualFactorAuthProofOptions
} from '../validators/authProofOptions.js';
import { floorTimestampToMinuteBucket } from '../utils/time.js';
import { NetworkError } from '../../errors/index.js';
import log from '../logger.js';
import { sdkErrorPipeline } from '../../errors/pipeline.js';

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
async function encodeMinuteSignatureProofPayload(options, normalizedChainId) {
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
      ['address', 'address', 'uint256', 'uint256'],
      [keyVaultAddr, authenticatorAddr, BigInt(normalizedChainId), BigInt(minuteBucket)]
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
  const { signer, authenticatorAddr, deadline, keyVaultAddr } = options;
  const { normalizedChainId } = assertWalletSignatureAuthProofOptions(options);

  log.info('Creating wallet signature auth proof');
  log.debug('createAuthProofWalletSignature', { keyVaultAddr, authenticatorAddr, chainId: normalizedChainId, deadline });

  const domain = {
    name: 'WalletSignatureAuthenticator',
    version: '1',
    chainId: normalizedChainId,
    verifyingContract: authenticatorAddr
  };
  const types = {
    WalletAuth: [
      { name: 'wallet', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const value = { wallet: keyVaultAddr, deadline };

  try {
    const signature = await signer.signTypedData(domain, types, value);
    return defaultAbiCoder.encode(['uint256', 'bytes'], [deadline, signature]);
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType: 'wallet-signature auth proof',
      functionName: 'createAuthProofWalletSignature',
      validationExtra: { deadline }
    });
  }
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
 *   {@code chainId} is invalid, or {@code passwordHash} is not a 32-byte hex string (raised by
 *   {@link assertMinuteSignatureAuthProofOptions})
 * @throws {NetworkError} If the latest block cannot be fetched (forwarded from
 *   {@link encodeMinuteSignatureProofPayload})
 */
async function createAuthProofMinuteSignature(options = {}) {
  const { normalizedChainId } = assertMinuteSignatureAuthProofOptions(options);
  log.info('Creating minute signature auth proof');
  return encodeMinuteSignatureProofPayload(options, normalizedChainId);
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
  const { signer, keyVaultAddr, authenticatorAddr, deadline } = options;

  const { normalizedChainId } = assertDualFactorAuthProofOptions(options);

  log.info('Creating dual-factor auth proof');
  log.debug('createAuthProofDualFactor', { keyVaultAddr, authenticatorAddr, chainId: normalizedChainId, deadline });

  const minuteProof = await encodeMinuteSignatureProofPayload(options, normalizedChainId);

  const [minutePasswordSignature] = defaultAbiCoder.decode(['bytes'], minuteProof.authProof);

  const domain = {
    name: 'DualFactorAuthenticator',
    version: '1',
    chainId: normalizedChainId,
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
    return defaultAbiCoder.encode(
      ['bytes', 'uint256', 'bytes'],
      [minutePasswordSignature, deadline, guardianSignature]
    );
  } catch (error) {
    sdkErrorPipeline.rethrow(error, {
      authProofType: 'dual-factor auth proof',
      functionName: 'createAuthProofDualFactor',
      validationExtra: { deadline }
    });
  }
}

export { createAuthProofWalletSignature, createAuthProofMinuteSignature, createAuthProofDualFactor };
