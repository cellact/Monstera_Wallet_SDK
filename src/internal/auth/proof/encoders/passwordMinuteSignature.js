/**
 * Encoder for the {@code PasswordMinuteSignatureAuthenticator} KeyVault {@code authProof}.
 *
 * Builds the minute-bucket ECDSA signature bundle via {@link createAuthProofMinuteSignature} and
 * returns just the {@code authProof} field of the resulting bundle.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').PasswordMinuteSignatureAuthProofInputOptions} PasswordMinuteSignatureAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').PasswordMinuteAuthProofEncoderOptions} PasswordMinuteAuthProofEncoderOptions
 *
 * @module internal/auth/proof/encoders/passwordMinuteSignature
 */

import { createAuthProofMinuteSignature } from '../../../crypto/index.js';

/**
 * Strategy registered against the PasswordMinuteSignatureAuthenticator address.
 *
 * @public
 * @readonly
 * @type {PasswordMinuteAuthProofEncoderOptions}
 */
export const passwordMinuteSignatureKeyVaultAuthProofEncoder = {
  id: 'passwordMinuteSignatureAuth',

  /**
   * Build the minute-bucket signature proof bytes.
   *
   * @public
   * @async
   * @param {AuthProofEncodeContext} ctx - Encode context (read provider, chain id, key vault addr,
   *   authenticator addr)
   * @param {PasswordMinuteSignatureAuthProofInputOptions} input - Structured input
   *   ({@code { passwordHash }})
   * @returns {Promise<Bytes>} ABI-encoded minute-bucket signature bytes
   * @throws {ValidationError} If {@code passwordHash} is invalid or any address is malformed
   *   (raised by {@link createAuthProofMinuteSignature})
   * @throws {WalletError} Any error translated by the SDK pipeline during the bucket / signing
   *   pre-flight (e.g. RPC failure)
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
