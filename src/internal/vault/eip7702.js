/**
 * KeyVault-specific EIP-7702 helpers (calldata encode/decode for {@code signAuthorizationImpl}).
 *
 * Pure authorization hash/verify/normalize/provider reads live in {@code internal/crypto/eip7702.js}.
 *
 * @module internal/vault/eip7702
 */

import { ZeroHash } from '../../adapters/ethers/addresses.js';
import { defaultAbiCoder, Interface } from '../../adapters/ethers/encoding.js';
import { requireAddress, requireBigInt, requireNonNegativeInteger, requireNonEmptyBytes } from '../validation/assert.js';
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
export function encodeSignAuthorizationImplCalldata(options = {}) {
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
 * Decode the {@code (bytes32 r, bytes32 s, uint8 yParity)} tuple returned by KeyVault's
 * {@code signAuthorizationImpl}.
 *
 * @public
 * @param {Bytes} returnData - Raw return data from {@code executeWithAuth}
 * @returns {AuthorizationSplitSignature} Split signature
 * @throws {ValidationError} If {@code returnData} is empty (raised by {@link requireNonEmptyBytes})
 *   or {@code yParity} is not exactly 0 / 1
 */
export function decodeSignAuthorizationResult(returnData) {
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
export function finalizeSignedAuthorizationResult(params) {
  const { delegateAddr, nonce, chainId, raw } = params;
  return {
    address: delegateAddr,
    nonce,
    chainId,
    signature: decodeSignAuthorizationResult(raw)
  };
}
