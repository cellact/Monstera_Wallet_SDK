/**
 * Factory for action-bound KeyVault {@code authProof} encoders.
 *
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 *
 * @module internal/auth/proof/createActionBoundProofEncoder
 */

import { resolveActionHash } from '../../crypto/authContext.js';
import { defaultProofDeadline } from '../defaults/authProofDefaults.js';

/**
 * Build a proof encoder strategy that resolves {@code actionHash} then delegates to {@code createProof}.
 *
 * @public
 * @template TInput
 * @param {Object} spec
 * @param {string} spec.id - Registry identifier
 * @param {(ctx: AuthProofEncodeContext & TInput & { actionHash: import('../../../types/index.js').Bytes32 }) => Promise<Bytes> | Bytes} spec.createProof
 * @param {boolean} [spec.withDeadline=false] - Default {@code deadline} when omitted
 * @param {(input: TInput) => void} [spec.validateInput] - Optional pre-flight validation
 * @returns {{ id: string, encode: (ctx: AuthProofEncodeContext, input: TInput) => Promise<Bytes> }}
 */
export function createActionBoundProofEncoder({ id, createProof, withDeadline = false, validateInput }) {
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
