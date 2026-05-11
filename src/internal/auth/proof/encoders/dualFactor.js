/**
 * Encoder for the {@code DualFactorAuthenticator} KeyVault {@code authProof}.
 *
 * Produces dual-factor proof bytes via {@link createAuthProofDualFactor}: a minute-bucket ECDSA
 * signature derived from the password hash plus an EIP-712 guardian signature. Defaults the
 * {@code deadline} to "now + 1 hour" when the caller doesn't supply one.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').DualFactorAuthProofInputOptions} DualFactorAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').DualFactorAuthProofEncoderOptions} DualFactorAuthProofEncoderOptions
 *
 * @module internal/auth/proof/encoders/dualFactor
 */

import { createAuthProofDualFactor } from '../../../crypto/index.js';
import { nowUnixTimestampSeconds } from '../../../../internal/utils/time.js';

/**
 * Strategy registered against the DualFactorAuthenticator address.
 *
 * @public
 * @readonly
 * @type {DualFactorAuthProofEncoderOptions}
 */
export const dualFactorKeyVaultAuthProofEncoder = {
  id: 'dualFactorAuth',

  /**
   * Build dual-factor proof bytes.
   *
   * @public
   * @async
   * @param {AuthProofEncodeContext} ctx - Encode context (read provider, chain id, key vault addr,
   *   authenticator addr)
   * @param {DualFactorAuthProofInputOptions} input - Structured input ({@code { passwordHash, signer, deadline? }})
   * @returns {Promise<Bytes>} ABI-encoded dual-factor signature bytes
   * @throws {ValidationError} If {@code passwordHash} / {@code signer} are missing or invalid, or
   *   any address is malformed (raised by {@link createAuthProofDualFactor})
   * @throws {WalletError} Any signer / network error translated by the SDK pipeline (e.g. minute
   *   bucket lookup failure, EIP-712 signing failure)
   */
  async encode(ctx, input) {
    const { passwordHash, signer } = input;

    let deadline = input.deadline;
    if (deadline == null) {
      deadline = nowUnixTimestampSeconds() + 3600;
    }
    return createAuthProofDualFactor({
      provider: ctx.readProvider,
      keyVaultAddr: ctx.keyVaultAddr,
      passwordHash,
      signer,
      authenticatorAddr: ctx.authenticatorAddr,
      deadline,
      chainId: ctx.chainId
    });
  }
};
