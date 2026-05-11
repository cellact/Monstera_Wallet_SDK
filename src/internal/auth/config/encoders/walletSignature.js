/**
 * Encoder for the {@code WalletSignatureAuthenticator} create-wallet auth config.
 *
 * Defers to {@link createWalletSigAuthConfig} which encodes the initial whitelist
 * ({@code address[]}) into the bytes layout expected by the contract.
 *
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 *
 * @module internal/auth/config/encoders/walletSignature
 */

import { createWalletSigAuthConfig } from '../../../crypto/index.js';

/**
 * Strategy registered against the WalletSignatureAuthenticator address.
 *
 * @public
 * @readonly
 * @type {{ id: string, encode: (authConfig: WalletSignatureAuthConfigInputOptions) => EncodedAuthConfigWalletSignature }}
 */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * Encode the initial whitelist into the contract-expected bytes layout.
   *
   * @public
   * @param {WalletSignatureAuthConfigInputOptions} authConfig - Structured input ({@code initialWhitelist})
   * @returns {EncodedAuthConfigWalletSignature} ABI-encoded whitelist bytes
   * @throws {ValidationError} If any address in {@code initialWhitelist} fails validation
   *   (raised by {@link createWalletSigAuthConfig})
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {Address[]} */ (initialWhitelist));
  }
};
