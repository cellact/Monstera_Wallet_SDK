/**
 * Password hash resolution for auth-proof input merging.
 *
 * @module internal/auth/proof/passwordInput
 */

import { keccak256 } from '../../../adapters/ethers/hashing.js';

/**
 * Resolve password hash from explicit hash, UTF-8 password bytes, or top-level options.
 *
 * @param {Record<string, unknown>} partial
 * @param {Record<string, unknown>} options
 * @returns {Bytes32 | undefined}
 */
export function resolvePasswordHashFromProofInput(partial, options) {
  if (partial.passwordHash != null) {
    return /** @type {Bytes32} */ (partial.passwordHash);
  }
  if (partial.password != null) {
    return keccak256(/** @type {Uint8Array} */ (partial.password));
  }
  if (options.passwordHash != null) {
    return /** @type {Bytes32} */ (options.passwordHash);
  }
  if (options.password != null) {
    return keccak256(/** @type {Uint8Array} */ (options.password));
  }
  return undefined;
}
