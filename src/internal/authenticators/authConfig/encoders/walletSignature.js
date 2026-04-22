/**
 * WalletSignatureAuthenticator — create-wallet {@code authConfig} (encoded whitelist).
 *
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').WalletSignatureAuthConfigInputOptions} WalletSignatureAuthConfigInputOptions
 * @typedef {import('../../../../types/index.js').EncodedWalletSignatureCreateWalletAuthConfig} EncodedWalletSignatureCreateWalletAuthConfig
 */

import { createWalletSigAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: WalletSignatureAuthConfigInputOptions) => EncodedWalletSignatureCreateWalletAuthConfig }} */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {WalletSignatureAuthConfigInputOptions} authConfig
   * @returns {EncodedWalletSignatureCreateWalletAuthConfig}
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {Address[]} */ (initialWhitelist));
  }
};
