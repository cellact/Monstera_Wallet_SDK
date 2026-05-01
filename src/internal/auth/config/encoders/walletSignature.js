/**
 * WalletSignatureAuthenticator — create-wallet {@code authConfig} (encoded whitelist).
 *
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedAuthConfigWalletSignature} EncodedAuthConfigWalletSignature
 */

import { createWalletSigAuthConfig } from '../../../crypto/index.js';

/** @type {{ id: string, encode: (authConfig: WalletSignatureAuthConfigInputOptions) => EncodedAuthConfigWalletSignature }} */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {WalletSignatureAuthConfigInputOptions} authConfig
   * @returns {EncodedAuthConfigWalletSignature}
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {Address[]} */ (initialWhitelist));
  }
};
