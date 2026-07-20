/**
 * Shared auth-proof pipeline helpers: action-bound encoders, defaults, password hash resolution.
 *
 * @module internal/auth/proof/common
 */

import { keccak256 } from '../../../adapters/ethers/hashing.js';
import { resolveActionHash } from '../context/actionContext.js';
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

/**
 * Build a proof encoder strategy that resolves {@code actionHash} then delegates to {@code createProof}.
 *
 * @public
 * @template TInput
 * @param {Object} spec
 * @param {string} spec.id - Registry identifier
 * @param {(ctx: AuthProofEncodeContext & TInput & { actionHash: Bytes32 }) => Promise<Bytes> | Bytes} spec.createProof
 * @param {boolean} [spec.withDeadline=false] - Default {@code deadline} when omitted
 * @param {(input: TInput) => void} [spec.validateInput] - Optional pre-flight validation
 * @returns {{ id: string, encode: (ctx: AuthProofEncodeContext, input: TInput) => Promise<Bytes> }}
 */
export function createActionBoundEncoder({ id, createProof, withDeadline = false, validateInput }) {
  return {
    id,

    /**
     * @param {AuthProofEncodeContext} ctx
     * @param {TInput} input
     * @returns {Promise<Bytes>}
     */
    async encode(ctx, input) {
      if (validateInput) {
        validateInput(input);
      }

      const actionHash = await resolveActionHash(ctx, {
        action: input.action,
        actionHash: input.actionHash
      });

      const proofInput = { ...ctx, ...input, actionHash };
      if (withDeadline && proofInput.deadline == null) {
        proofInput.deadline = defaultProofDeadline();
      }

      return createProof(proofInput);
    }
  };
}
