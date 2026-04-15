/**
 * WalletSignatureAuthenticator — create-wallet {@code authConfig} (encoded whitelist).
 */

import { createWalletSigAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../../types/index.js').Bytes }} */
export const walletSignatureAuthCreateWalletEncoder = {
  id: 'walletSignatureAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {import('../../../types/index.js').Bytes}
   */
  encode(authConfig) {
    const { initialWhitelist } = authConfig;
    return createWalletSigAuthConfig(/** @type {string[]} */ (initialWhitelist));
  }
};
