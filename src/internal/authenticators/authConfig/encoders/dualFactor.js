/**
 * DualFactorAuthenticator — create-wallet {@code authConfig} (ABI-encoded hash + guardian).
 *
 * @typedef {import('../../../../types/index.js').Bytes32} Bytes32
 * @typedef {import('../../../../types/index.js').Address} Address
 * @typedef {import('../../../../types/index.js').CreateWalletDualFactorAuthConfig} CreateWalletDualFactorAuthConfig
 * @typedef {import('../../../../types/index.js').EncodedDualFactorCreateWalletAuthConfig} EncodedDualFactorCreateWalletAuthConfig
 */

import { createDualFactorAuthConfig } from '../../../crypto/wallet.js';

/** @type {{ id: string, encode: (authConfig: CreateWalletDualFactorAuthConfig) => EncodedDualFactorCreateWalletAuthConfig }} */
export const dualFactorAuthCreateWalletEncoder = {
  id: 'dualFactorAuth',

  /**
   * @param {CreateWalletDualFactorAuthConfig} authConfig
   * @returns {EncodedDualFactorCreateWalletAuthConfig}
   */
  encode(authConfig) {
    const { passwordHash, guardianAddr } = authConfig;
    return createDualFactorAuthConfig(
      /** @type {Bytes32} */ (passwordHash),
      /** @type {Address} */ (guardianAddr)
    );
  }
};
