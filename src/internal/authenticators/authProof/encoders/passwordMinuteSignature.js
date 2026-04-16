/**
 * PasswordMinuteSignatureAuthenticator — minute-bucket password signature bundle.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../encodeAuthProofOptions.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 */

import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofMinuteSignature } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (ctx: KeyVaultAuthProofEncodeContext, input: Record<string, unknown>) => Promise<Bytes> }} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {Record<string, unknown>} input
   * @returns {Promise<Bytes>}
   */
  async encode(ctx, input) {
    const { passwordHash } = input;
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new ValidationError(
        'authProof object requires passwordHash (bytes32 hex string)',
        'authProof',
        input
      );
    }
    const result = await createAuthProofMinuteSignature({
      provider: ctx.readProvider,
      keyVaultAddr: ctx.keyVaultAddr,
      authenticatorAddr: ctx.authenticatorAddr,
      chainId: ctx.chainId,
      passwordHash
    });
    return result.authProof;
  }
};
