/**
 * WalletSignatureAuthenticator — create-wallet {@code authConfig} (encoded whitelist).
 *
 * @typedef {import('../../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').CreateWalletWalletSignatureAuthConfig} CreateWalletWalletSignatureAuthConfig
 */

import { createWalletSigAuthConfig } from '../../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletWalletSignatureAuthConfig) => Bytes }} */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {CreateWalletWalletSignatureAuthConfig} authConfig
   * @returns {Bytes}
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {Address[]} */ (initialWhitelist));
  }
};
