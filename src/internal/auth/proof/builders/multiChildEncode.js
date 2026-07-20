/**
 * Multi-authenticator child proof delegation.
 *
 * @module internal/auth/proof/builders/multiChildEncode
 */

import { resolveChildAddr, resolveChildSpec } from '../../specs/multiChildResolver.js';
import { createAuthProofMulti } from './abiProofs.js';

/**
 * Encode a child authenticator proof and wrap it for {@code MultiAuthenticator}.
 *
 * @param {AuthProofEncodeContext & Record<string, unknown> & { actionHash: Bytes32 }} proofInput
 * @returns {Promise<Bytes>}
 */
export async function encodeMultiChildProof(proofInput) {
  const addresses = proofInput.addresses;
  const childAddr = resolveChildAddr(proofInput, addresses);
  const childSpec = resolveChildSpec(proofInput, addresses);

  const childCtx = { ...proofInput, authenticatorAddr: childAddr, addresses };
  const childInput = {
    ...proofInput,
    authenticatorAddr: childAddr
  };

  const childProof = await childSpec.proofEncoder.encode(childCtx, childInput);
  return createAuthProofMulti({ child: childAddr, childProof });
}
