/**
 * WalletSignatureAuthenticator — create-wallet {@code authConfig} (encoded whitelist).
 *
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 */

import { createWalletSigAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => Bytes }} */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {Bytes}
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {string[]} */ (initialWhitelist));
  }
};
