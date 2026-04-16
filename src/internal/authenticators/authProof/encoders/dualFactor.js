/**
 * DualFactorAuthenticator — dual-factor auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../encodeAuthProofOptions.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 */

import { HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofDualFactor } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (ctx: KeyVaultAuthProofEncodeContext, input: Record<string, unknown>) => Promise<Bytes> }} */
export const dualFactorKeyVaultAuthProofEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {Record<string, unknown>} input
   * @returns {Promise<Bytes>}
   */
  async encode(ctx, input) {
    const { passwordHash, signer } = input;
    if (!signer || (!(signer instanceof Wallet) && !(signer instanceof HDNodeWallet))) {
      throw new ValidationError(
        'authProof object requires signer (Wallet or HDNodeWallet) and passwordHash',
        'authProof',
        input
      );
    }
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new ValidationError(
        'authProof object requires passwordHash (bytes32 hex string)',
        'authProof',
        input
      );
    }
    let deadline = input.deadline;
    if (deadline == null) {
      deadline = Math.floor(Date.now() / 1000) + 3600;
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
