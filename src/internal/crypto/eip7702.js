/**
 * Pure EIP-7702 authorization primitives (no KeyVault coupling).
 *
 * KeyVault-specific calldata encode/decode lives in {@code internal/vault/eip7702.js}.
 *
 * @module internal/crypto/eip7702
 */

import { getAddress } from '../../adapters/ethers/addresses.js';
import {
  hashAuthorization as etherHashAuthorizationTuple,
  verifyAuthorization as etherVerifyAuthorizationTuple
} from '../../adapters/ethers/signing.js';
import {
  requireAddress,
  requireNonEmptyObject,
  requireProviderMethod
} from '../validation/assert.js';

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
 */
export function normalizeAuthorizationTuple(auth) {
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
export function hashAuthorization(auth) {
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
export function verifyAuthorization(auth, signature) {
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
 */
export async function fetchAuthorizationChainId(provider) {
  requireProviderMethod(provider, 'getNetwork', 'provider');
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
 */
export async function fetchAuthorizationNonce(provider, authorityAddress) {
  requireProviderMethod(provider, 'getTransactionCount', 'provider');
  requireAddress(authorityAddress, 'authorityAddress');
  const count = await provider.getTransactionCount(authorityAddress);
  return BigInt(count);
}
