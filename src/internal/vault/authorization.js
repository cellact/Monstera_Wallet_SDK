/**
 * EIP-7702 authorization helpers.
 *
 * Used by {@code signAuthorization.js} (the high-level {@code Monstera.signAuthorization} flow).
 * Covers:
 * - hashing / verifying authorization tuples (delegating to ethers v6's
 *   {@code hashAuthorization} / {@code verifyAuthorization})
 * - reading {@code chainId} and {@code authorityAddress.nonce} from an ethers provider
 * - encoding the {@code signAuthorizationImpl} calldata that KeyVault expects via its
 *   {@code executeWithAuth} entry point
 * - decoding the {@code (r, s, yParity)} return triple that KeyVault produces
 * - small adapters: {@link toChecksumAddress}, {@link finalizeSignedAuthorizationResult}
 *
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').CreateImplCallOptions} CreateImplCallOptions
 * @typedef {import('../../types/index.js').AuthorizationSplitSignature} AuthorizationSplitSignature
 * @typedef {import('../../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 *
 * @module internal/crypto/authorization
 */

import { ZeroHash, getAddress } from '../../adapters/ethers/addresses.js';
import { defaultAbiCoder, Interface } from '../../adapters/ethers/encoding.js';
import {
  hashAuthorization as etherHashAuthorizationTuple,
  verifyAuthorization as etherVerifyAuthorizationTuple
} from '../../adapters/ethers/signing.js';
import { requireAddress, requireBigInt, requireNonNegativeInteger, requireNonEmptyBytes, requireNonEmptyObject } from '../assert.js';
import { ValidationError } from '../../errors/index.js';

/**
 * Minimal ABI fragment for KeyVault's {@code signAuthorizationImpl} entry point.
 *
 * @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7702.md
 *
 * @private
 * @readonly
 */
const SIGN_AUTHORIZATION_IMPL_ABI = [
  'function signAuthorizationImpl(bytes32 baseKey, bytes32 baseChain, uint32 index, address delegate, uint64 authNonce, uint256 chainId) view returns (bytes32 r, bytes32 s, uint8 yParity)'
];

/**
 * Cached ethers {@link Interface} for {@link SIGN_AUTHORIZATION_IMPL_ABI}.
 *
 * @private
 * @readonly
 */
const signAuthorizationImplInterface = new Interface(SIGN_AUTHORIZATION_IMPL_ABI);

/** @private @readonly */
const UINT64_MAX = (1n << 64n) - 1n;
/** @private @readonly */
const UINT32_MAX = (1n << 32n) - 1n;

/**
 * EIP-7702 authorization tuple for hashing / verification (ethers-compatible field names).
 *
 * @typedef {{ chainId: bigint, address: Address, nonce: bigint }} AuthorizationTupleInput
 */

/**
 * Normalise caller input into an ethers authorization tuple.
 *
 * @description Accepts either {@code address} or {@code delegateAddr} as the target field name
 * (the SDK uses {@code delegateAddr} elsewhere; ethers uses {@code address}). Performs full
 * validation and EIP-55 checksumming.
 *
 * @public
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number | bigint, nonce: number | bigint }} auth -
 *   Authorization tuple (one of {@code address} / {@code delegateAddr} required)
 * @returns {AuthorizationTupleInput} Normalised tuple ({@code chainId} / {@code nonce} as
 *   {@code bigint}, {@code address} checksummed)
 * @throws {ValidationError} If {@code auth} is not an object, or the address fails validation
 *   (raised by {@link requireNonEmptyObject} / {@link requireAddress})
 */
function normalizeAuthorizationTuple(auth) {
  requireNonEmptyObject(auth, 'auth');
  const rawAddr = auth.address ?? auth.delegateAddr;
  requireAddress(rawAddr, 'address');
  const address = getAddress(rawAddr);
  const chainId = BigInt(auth.chainId);
  const nonce = BigInt(auth.nonce);
  return { chainId, address, nonce };
}

/**
 * Compute the EIP-7702 authorization digest.
 *
 * @description {@code keccak256(0x05 || rlp([chainId, address, nonce]))} — delegated to
 * {@code ethers.hashAuthorization} via the adapter.
 *
 * @public
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number | bigint, nonce: number | bigint }} auth -
 *   Authorization tuple
 * @returns {Bytes32} 32-byte digest hex string
 * @throws {ValidationError} Forwarded from {@link normalizeAuthorizationTuple}
 */
function hashAuthorization(auth) {
  return etherHashAuthorizationTuple(normalizeAuthorizationTuple(auth));
}

/**
 * Recover the signer of an EIP-7702 authorization.
 *
 * @public
 * @param {{ address?: Address, delegateAddr?: Address, chainId: number | bigint, nonce: number | bigint }} auth -
 *   Authorization tuple
 * @param {AuthorizationSplitSignature} signature - Split signature ({@code r}, {@code s},
 *   {@code yParity})
 * @returns {Address} Recovered signer address (EIP-55 checksum)
 * @throws {ValidationError} Forwarded from {@link normalizeAuthorizationTuple}
 */
function verifyAuthorization(auth, signature) {
  return etherVerifyAuthorizationTuple(normalizeAuthorizationTuple(auth), signature);
}

/**
 * Read the EIP-155 chain id from a provider's current network.
 *
 * @public
 * @async
 * @param {EthersAbstractProvider} provider - Ethers provider exposing {@code getNetwork}
 * @returns {Promise<bigint>} Chain id as {@code bigint}
 * @throws {ValidationError} If {@code provider} does not expose {@code getNetwork}
 * @throws {NetworkError} Forwarded from the provider's network read on transport failures
 */
async function fetchAuthorizationChainId(provider) {
  if (!provider || typeof provider.getNetwork !== 'function') {
    throw new ValidationError('provider must expose getNetwork()', 'provider', provider);
  }
  const net = await provider.getNetwork();
  return BigInt(net.chainId);
}

/**
 * Read the EIP-7702 authorization {@code nonce} for an authority address.
 *
 * @description Returns the authority's latest transaction count on the target chain — the value
 * that goes into the authorization tuple's {@code nonce} slot.
 *
 * @public
 * @async
 * @param {EthersAbstractProvider} provider - Ethers provider exposing {@code getTransactionCount}
 * @param {Address} authorityAddress - EOA acting as authority
 * @returns {Promise<bigint>} Latest nonce as {@code bigint}
 * @throws {ValidationError} If {@code provider} does not expose {@code getTransactionCount}, or
 *   {@code authorityAddress} fails address validation
 * @throws {NetworkError} Forwarded from the provider's transaction-count read on transport failures
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
 * Encode {@code signAuthorizationImpl} calldata for {@code KeyVaultClient.executeWithAuth}.
 *
 * @description Validates {@code index} / {@code nonce} / {@code chainId} fit their on-chain widths
 * (uint32 / uint64 / non-negative respectively) and encodes them with two zero placeholders for
 * {@code baseKey} and {@code baseChain}.
 *
 * @public
 * @param {CreateImplCallOptions} [options={}] - {@code index}, {@code delegateAddr},
 *   {@code nonce}, {@code chainId}
 * @returns {Bytes} ABI-encoded calldata (hex)
 * @throws {ValidationError} If {@code index} is missing/negative/non-integer (raised by
 *   {@link requireNonNegativeInteger}), if {@code delegateAddr} fails address validation, if
 *   {@code index} > uint32 max, if {@code nonce} is outside [0, uint64 max], or if
 *   {@code chainId} is negative
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

  const chainBn = requireBigInt(chainId, 'chainId', { allowNegative: false });

  return signAuthorizationImplInterface.encodeFunctionData('signAuthorizationImpl', [
    ZeroHash,
    ZeroHash,
    Number(idx),
    delegateAddr,
    nonceBn,
    chainBn
  ]);
}

/**
 * Validate and EIP-55 checksum an EVM address (same semantics as {@code ethers.getAddress}).
 *
 * @public
 * @param {Address} address - EVM address (any case)
 * @returns {Address} Checksum-cased address
 * @throws {ValidationError} If {@code address} fails validation (raised by {@link requireAddress})
 */
function toChecksumAddress(address) {
  requireAddress(address, 'address');
  return getAddress(address);
}

/**
 * Decode the {@code (bytes32 r, bytes32 s, uint8 yParity)} tuple returned by KeyVault's
 * {@code signAuthorizationImpl}.
 *
 * @public
 * @param {Bytes} returnData - Raw return data from {@code executeWithAuth}
 * @returns {AuthorizationSplitSignature} Split signature
 * @throws {ValidationError} If {@code returnData} is empty (raised by {@link requireNonEmptyBytes})
 *   or {@code yParity} is not exactly 0 / 1
 */
function decodeSignAuthorizationResult(returnData) {
  requireNonEmptyBytes(returnData, 'returnData');
  const decoded = defaultAbiCoder.decode(['bytes32', 'bytes32', 'uint8'], returnData);
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
 * Assemble the public {@link SignedAuthorizationResult} from resolved fields and the raw KeyVault
 * return blob.
 *
 * @public
 * @param {{ delegateAddr: Address, nonce: bigint, chainId: bigint, raw: Bytes }} params - Pre-resolved
 *   fields (delegate / nonce / chain id) plus the raw return data from {@code executeWithAuth}
 * @returns {SignedAuthorizationResult} Authorization tuple + decoded split signature
 * @throws {ValidationError} Forwarded from {@link decodeSignAuthorizationResult}
 */
function finalizeSignedAuthorizationResult(params) {
  const { delegateAddr, nonce, chainId, raw } = params;
  return {
    address: delegateAddr,
    nonce,
    chainId,
    signature: decodeSignAuthorizationResult(raw)
  };
}

export {
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
