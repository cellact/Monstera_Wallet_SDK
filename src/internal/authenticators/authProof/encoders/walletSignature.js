/**
 * WalletSignatureAuthenticator — EIP-712 wallet auth proof bytes.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofEncodeContext} KeyVaultAuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').KeyVaultWalletSignatureAuthProofInput} KeyVaultWalletSignatureAuthProofInput
 * @typedef {import('../../../../types/index.js').KeyVaultAuthProofWalletSignatureEncoder} KeyVaultAuthProofWalletSignatureEncoder
 */

import { createAuthProofWalletSignature } from '../../../crypto/wallet.js';
import { requireWalletOrHdNode } from '../../../../internal/assert.js';
import { nowUnixTimestampSeconds } from '../../../../internal/utils/time.js';

/** @type {KeyVaultAuthProofWalletSignatureEncoder} */
export const walletSignatureKeyVaultAuthProofEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {KeyVaultAuthProofEncodeContext} ctx
   * @param {KeyVaultWalletSignatureAuthProofInput} input
   * @returns {Promise<Bytes>}
   * @throws {ValidationError} If signer is not a Wallet or HDNodeWallet
   */
  async encode(ctx, input) {
    const signer = input.signer;

    requireWalletOrHdNode(signer, 'signer');

    let deadline = input.deadline;
    if (deadline == null) {
      deadline = nowUnixTimestampSeconds() + 3600; // 1 hour from now
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
