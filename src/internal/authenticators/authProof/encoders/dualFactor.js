/**
 * DualFactorAuthenticator — dual-factor auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultDualFactorAuthProofInput} KeyVaultDualFactorAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofDualFactorEncoder} KeyVaultAuthProofDualFactorEncoder
 */

import { createAuthProofDualFactor } from '../../../../crypto/wallet.js';
import { requireWalletOrHdNode, requireBytes32 } from '../../../../internal/assert.js';
import { nowUnixTimestampSeconds } from '../../../../internal/utils/time.js';

/** @type {KeyVaultAuthProofDualFactorEncoder} */
export const dualFactorKeyVaultAuthProofEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {KeyVaultDualFactorAuthProofInput} input
   * @returns {Promise<Bytes>}
   */
  async encode(ctx, input) {
    const { passwordHash, signer } = input;

    requireWalletOrHdNode(signer, 'signer');
    requireBytes32(passwordHash, 'passwordHash');

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
