/**
 * WalletSignatureAuthenticator — EIP-712 wallet auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultWalletSignatureAuthProofInput} KeyVaultWalletSignatureAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofWalletSignatureEncoder} KeyVaultAuthProofWalletSignatureEncoder
 */

import { HDNodeWallet, Wallet } from 'ethers';
import { ValidationError } from '../../../../errors/index.js';
import { createAuthProofWalletSignature } from '../../../../crypto/wallet.js';

/** @type {KeyVaultAuthProofWalletSignatureEncoder} */
export const walletSignatureKeyVaultAuthProofEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {KeyVaultWalletSignatureAuthProofInput} input
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
