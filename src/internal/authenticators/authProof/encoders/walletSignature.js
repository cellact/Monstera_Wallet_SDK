/**
 * WalletSignatureAuthenticator — EIP-712 wallet auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../encodeAuthProofOptions.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 */

import { HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofWalletSignature } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (ctx: KeyVaultAuthProofEncodeContext, input: Record<string, unknown>) => Promise<Bytes> }} */
export const walletSignatureKeyVaultAuthProofEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {Record<string, unknown>} input
   * @returns {Promise<Bytes>}
   */
  async encode(ctx, input) {
    const signer = input.signer;
    if (!signer || (!(signer instanceof Wallet) && !(signer instanceof HDNodeWallet))) {
      throw new ValidationError(
        'authProof object requires signer (Wallet or HDNodeWallet)',
        'authProof',
        input
      );
    }
    let deadline = input.deadline;
    if (deadline == null) {
      deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    }
    return createAuthProofWalletSignature({
      signer,
      chainId: ctx.chainId,
      authenticatorAddr: ctx.authenticatorAddr,
      deadline,
      keyVaultAddr: ctx.keyVaultAddr
    });
  }
};
