/**
 * PasswordMinuteSignatureAuthenticator — minute-bucket password signature bundle.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').PasswordMinuteSignatureAuthProofInputOptions} PasswordMinuteSignatureAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').PasswordMinuteAuthProofEncoderOptions} PasswordMinuteAuthProofEncoderOptions
 */

import { createAuthProofMinuteSignature } from '../../../crypto/index.js';

/** @type {PasswordMinuteAuthProofEncoderOptions} */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * @param {AuthProofEncodeContext} ctx
   * @param {PasswordMinuteSignatureAuthProofInputOptions} input
   * @returns {Promise<Bytes>}
   * @throws {ValidationError} If inputs are invalid ({@link createAuthProofMinuteSignature})
   */
  async encode(ctx, input) {
    const { passwordHash } = input;
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
