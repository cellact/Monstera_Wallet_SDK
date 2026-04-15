/**
 * PasswordMinuteSignatureAuthenticator — minute-bucket password signature bundle.
 */

import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofMinuteSignature } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (ctx: object, input: Record<string, unknown>) => Promise<string> }} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {object} ctx
   * @param {Record<string, unknown>} input
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
