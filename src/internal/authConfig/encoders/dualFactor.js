/**
 * DualFactorAuthenticator — create-wallet {@code authConfig} (ABI-encoded hash + guardian).
 *
 * @typedef {import('../../../types/index.js').Bytes} Bytes
 * @typedef {import('../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../types/index.js').Address} Address
 */

import { createDualFactorAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: Record<string, unknown>) => Bytes }} */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {Record<string, unknown>} authConfig
   * @returns {Bytes}
   */
  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {Bytes32} */ (passwordHash),
      /** @type {Address} */ (guardianAddr)
    );
  }
};
