/**
 * Encoder for the {@code WalletSignatureAuthenticator} KeyVault {@code authProof}.
 *
 * Produces EIP-712 wallet-signature bytes via {@link createAuthProofWalletSignature}. Defaults
 * the proof {@code deadline} to "now + 1 hour" when the caller doesn't supply one.
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').AuthProofEncodeContext} AuthProofEncodeContext
 * @typedef {import('../../../../types/index.js').WalletSignatureAuthProofInputOptions} WalletSignatureAuthProofInputOptions
 * @typedef {import('../../../../types/index.js').WalletSignatureAuthProofEncoderOptions} WalletSignatureAuthProofEncoderOptions
 *
 * @module internal/auth/proof/encoders/walletSignature
 */

import { createAuthProofWalletSignature } from '../../../crypto/index.js';
import { nowUnixTimestampSeconds } from '../../../../internal/utils/time.js';

/**
 * Strategy registered against the WalletSignatureAuthenticator address.
 *
 * @public
 * @readonly
 * @type {WalletSignatureAuthProofEncoderOptions}
 */
export const walletSignatureKeyVaultAuthProofEncoder = {
  id: 'walletSignatureAuth',

  /**
   * Build EIP-712 wallet-signature proof bytes.
   *
   * @public
   * @async
   * @param {AuthProofEncodeContext} ctx - Encode context (chain id, authenticator addr, key vault addr)
   * @param {WalletSignatureAuthProofInputOptions} input - Structured input ({@code { signer, deadline? }})
   * @returns {Promise<Bytes>} ABI-encoded EIP-712 signature bytes
   * @throws {ValidationError} If {@code signer} is missing/invalid or any address is malformed
   *   (raised by {@link createAuthProofWalletSignature})
   * @throws {WalletError} Any signer-side error translated by the {@code signingTranslator}
   *   (network failures, encoding failures, generic signer rejections)
   */
  async encode(ctx, input) {
    const signer = input.signer;

    let deadline = input.deadline;
    if (deadline == null) {
      deadline = nowUnixTimestampSeconds() + 3600;
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
