/**
 * Shared auth-proof pipeline helpers: action-bound encoders, defaults, multi-child delegation.
 *
 * @module internal/auth/proof/common
 */

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
