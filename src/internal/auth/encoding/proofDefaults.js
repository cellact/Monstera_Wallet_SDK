/**
 * Shared defaults and helpers for auth-proof encoding.
 *
 * @module internal/auth/encoding/proofDefaults
 */

import { keccak256 } from '../../../adapters/ethers/hashing.js';
import { isPlainObject } from '../../validation/assert.js';
import { nowUnixTimestampSeconds } from '../../utils/time.js';

/** @readonly */
export const DEFAULT_PROOF_DEADLINE_OFFSET_SEC = 3600;

/**
 * @returns {number}
 */
export function defaultProofDeadline() {
  return nowUnixTimestampSeconds() + DEFAULT_PROOF_DEADLINE_OFFSET_SEC;
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function pickAuthProofPartial(options) {
  return isPlainObject(options.authProof) ? /** @type {Record<string, unknown>} */ (options.authProof) : {};
}

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
