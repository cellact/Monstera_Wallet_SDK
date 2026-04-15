/**
 * DualFactorAuthenticator — dual-factor auth proof bytes.
 */

import { HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofDualFactor } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (ctx: object, input: Record<string, unknown>) => Promise<string> }} */
export const dualFactorKeyVaultAuthProofEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {object} ctx
   * @param {Record<string, unknown>} input
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
