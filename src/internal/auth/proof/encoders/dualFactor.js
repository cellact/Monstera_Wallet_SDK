/**
 * DualFactorAuthenticator — dual-factor auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').DualFactorAuthProofInputOptions} DualFactorAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').DualFactorAuthProofEncoderOptions} DualFactorAuthProofEncoderOptions
 */

import { createAuthProofDualFactor } from '../../../crypto/index.js';
import { nowUnixTimestampSeconds } from '../../../../internal/utils/time.js';

/** @type {DualFactorAuthProofEncoderOptions} */
export const dualFactorKeyVaultAuthProofEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {AuthProofEncodeContext} ctx
   * @param {DualFactorAuthProofInputOptions} input
   * @returns {Promise<Bytes>}
   * @throws {ValidationError} If inputs are invalid ({@link createAuthProofDualFactor})
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
