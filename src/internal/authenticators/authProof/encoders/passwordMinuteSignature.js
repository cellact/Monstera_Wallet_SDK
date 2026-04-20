/**
 * PasswordMinuteSignatureAuthenticator — minute-bucket password signature bundle.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultPasswordMinuteSignatureAuthProofInput} KeyVaultPasswordMinuteSignatureAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofPasswordMinuteEncoder} KeyVaultAuthProofPasswordMinuteEncoder
 */

import { createAuthProofMinuteSignature } from '../../../crypto/wallet.js';
import { requireBytes32 } from '../../../../internal/assert.js';

/** @type {KeyVaultAuthProofPasswordMinuteEncoder} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {KeyVaultPasswordMinuteSignatureAuthProofInput} input
   * @returns {Promise<Bytes>}
   * @throws {ValidationError} If passwordHash is not a valid 32-byte hex string
   */
  async encode(ctx, input) {
    const { passwordHash } = input;
    requireBytes32(passwordHash, 'passwordHash');
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
