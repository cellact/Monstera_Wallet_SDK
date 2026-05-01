/**
 * EIP-7702-style authorization tuple hashing, KeyVault {@code signAuthorizationImpl} calldata, and related helpers.
 *
 * @typedef {import('../../types/index.js').Bytes} Bytes
 * @typedef {import('../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').CreateImplCallOptions} CreateImplCallOptions
 * @typedef {import('../../types/index.js').AuthorizationSplitSignature} AuthorizationSplitSignature
 * @typedef {import('../../types/index.js').SignedAuthorizationResult} SignedAuthorizationResult
 * @typedef {import('../../types/index.js').EthersAbstractProvider} EthersAbstractProvider
 */

import { ethers } from 'ethers';
import { requireAddress, requireNonNegativeInteger, requireBytes, requireObject } from '../assert.js';
import { ValidationError } from '../../errors/index.js';

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
  requireObject(auth, 'auth');
  const rawAddr = auth.address ?? auth.delegateAddr;
  requireAddress(rawAddr, 'address');
  const address = ethers.getAddress(rawAddr);
  const chainId = BigInt(auth.chainId);
  const nonce = BigInt(auth.nonce);
  return { chainId, address, nonce };
}

/**
 * EIP-7702 authorization digest: {@code keccak256(0x05 || rlp([chainId, address, nonce]))}.
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
 * @param {EthersAbstractProvider} provider
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
 * @param {EthersAbstractProvider} provider
 * @param {Address} authorityAddress
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
 * Decode KeyVault {@code executeWithAuth} return data from {@code signAuthorizationImpl}.
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
