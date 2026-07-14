/**
 * Factory for action-bound KeyVault {@code authProof} encoders.
 *
 * @module internal/auth/encoding/createActionBoundEncoder
 */

import { resolveActionHash } from '../actionContext.js';
import { defaultProofDeadline } from './proofDefaults.js';

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
