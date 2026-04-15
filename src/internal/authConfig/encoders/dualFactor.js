/**
 * DualFactorAuthenticator — create-wallet {@code authConfig} (ABI-encoded hash + guardian).
 */

import { createDualFactorAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => import('../../../types/index.js').Bytes }} */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {import('../../../types/index.js').Bytes}
   */
  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {import('../../../types/index.js').Bytes32} */ (passwordHash),
      /** @type {import('../../../types/index.js').Address} */ (guardianAddr)
    );
  }
};
