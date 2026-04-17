/**
 * PasswordMinuteSignatureAuthenticator — minute-bucket password signature bundle.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultPasswordMinuteSignatureAuthProofInput} KeyVaultPasswordMinuteSignatureAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofPasswordMinuteEncoder} KeyVaultAuthProofPasswordMinuteEncoder
 */

import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofMinuteSignature } from '../../../../crypto/wallet.js';

/** @type {KeyVaultAuthProofPasswordMinuteEncoder} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {KeyVaultPasswordMinuteSignatureAuthProofInput} input
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
